// @flow

import {CircleLayoutArray} from '../array_types.js';

import {members as layoutAttributes} from './circle_attributes.js';
import SegmentVector from '../segment.js';
import {ProgramConfigurationSet} from '../program_configuration.js';
import {TriangleIndexArray} from '../index_array_type.js';
import loadGeometry from '../load_geometry.js';
import toEvaluationFeature from '../evaluation_feature.js';
import EXTENT from '../extent.js';
import {register} from '../../util/web_worker_transfer.js';
import EvaluationParameters from '../../style/evaluation_parameters.js';

import type {CanonicalTileID} from '../../source/tile_id.js';
import type {
    Bucket,
    BucketParameters,
    BucketFeature,
    IndexedFeature,
    PopulateParameters
} from '../bucket.js';
import type CircleStyleLayer from '../../style/style_layer/circle_style_layer.js';
import type HeatmapStyleLayer from '../../style/style_layer/heatmap_style_layer.js';
import type Context from '../../gl/context.js';
import type IndexBuffer from '../../gl/index_buffer.js';
import type VertexBuffer from '../../gl/vertex_buffer.js';
import type Point from '@mapbox/point-geometry';
import type {FeatureStates} from '../../source/source_state.js';
import type {ImagePosition} from '../../render/image_atlas.js';
import type {TileTransform} from '../../geo/projection/tile_transform.js';

// This should be moved to a separate file
class ParticleSystem {
    emitters: Array<Emitter>;
    lastUpdate: any;

    constructor() {
        this.emitters = [];
        this.lastUpdate = new Date().getTime();
    }
    
    update() {
        let now = new Date().getTime();
        let sinceLastUpdateMillis = now - this.lastUpdate;
        if (sinceLastUpdateMillis < 100) {
            return;
        }
        for (const emitter of this.emitters) {
            emitter.update();
        }
        this.lastUpdate = new Date().getTime();
    }

    addEmitter(location: Point) {
        for (const emitter of this.emitters) {
            if (emitter.location == location) {
                // Workaround: Don't add twice (we need unique feature ID or something)
                return;
            }
        }
        this.emitters.push(new Emitter(location));
    }

}

register('ParticleSystem', ParticleSystem);
class Emitter {
    particles: Array<Particle>;
    location: Point;
    maxParticleCount: number;

    constructor(location: Point) {
        this.particles = [];
        this.location = location;
        this.maxParticleCount = 10;
    }
    
    update() {
        if (this.particles.length < this.maxParticleCount) {
            this.particles.push(new Particle());
        }
        for (const particle of this.particles) {
            particle.update();
        }
    }

}

register('Emitter', Emitter);
class Particle {
    isAlive: boolean;
    locationOffset: any;
    elevation: number;

    constructor() {
        this.isAlive = true;
        this.locationOffset = {x:0,y:0};
        this.locationOffset.x = Math.random() * 500.0 - 250.0;
        this.locationOffset.y = Math.random() * 500.0 - 250.0;
        console.count("New particle");
    }
    
    update() {
        this.locationOffset.x += (Math.random() - 0.5) * 100.0;
        this.locationOffset.y += (Math.random() - 0.5) * 100.0;
    }

}

register('Particle', Particle);

function addCircleVertex(layoutVertexArray, x, y, extrudeX, extrudeY) {
    layoutVertexArray.emplaceBack(
        (x * 2) + ((extrudeX + 1) / 2),
        (y * 2) + ((extrudeY + 1) / 2));
}

/**
 * Circles are represented by two triangles.
 *
 * Each corner has a pos that is the center of the circle and an extrusion
 * vector that is where it points.
 * @private
 */
class CircleBucket<Layer: CircleStyleLayer | HeatmapStyleLayer> implements Bucket {
    system: ParticleSystem;
    index: number;
    zoom: number;
    overscaling: number;
    layerIds: Array<string>;
    layers: Array<Layer>;
    stateDependentLayers: Array<Layer>;
    stateDependentLayerIds: Array<string>;

    layoutVertexArray: CircleLayoutArray;
    layoutVertexBuffer: VertexBuffer;

    indexArray: TriangleIndexArray;
    indexBuffer: IndexBuffer;

    hasPattern: boolean;
    programConfigurations: ProgramConfigurationSet<Layer>;
    segments: SegmentVector;
    uploaded: boolean;

    constructor(options: BucketParameters<Layer>) {
        this.system = new ParticleSystem();
        this.zoom = options.zoom;
        this.overscaling = options.overscaling;
        this.layers = options.layers;
        this.layerIds = this.layers.map(layer => layer.id);
        this.index = options.index;
        this.hasPattern = false;

        this.layoutVertexArray = new CircleLayoutArray();
        this.indexArray = new TriangleIndexArray();
        this.segments = new SegmentVector();
        this.programConfigurations = new ProgramConfigurationSet(options.layers, options.zoom);
        this.stateDependentLayerIds = this.layers.filter((l) => l.isStateDependent()).map((l) => l.id);
    }

    populate(features: Array<IndexedFeature>, options: PopulateParameters, canonical: CanonicalTileID, tileTransform: TileTransform) {
        const styleLayer = this.layers[0];
        const bucketFeatures = [];
        let circleSortKey = null;

        // Heatmap layers are handled in this bucket and have no evaluated properties, so we check our access
        if (styleLayer.type === 'circle') {
            circleSortKey = ((styleLayer: any): CircleStyleLayer).layout.get('circle-sort-key');
        }

        for (const {feature, id, index, sourceLayerIndex} of features) {
            const needGeometry = this.layers[0]._featureFilter.needGeometry;
            const evaluationFeature = toEvaluationFeature(feature, needGeometry);

            if (!this.layers[0]._featureFilter.filter(new EvaluationParameters(this.zoom), evaluationFeature, canonical)) continue;

            const sortKey = circleSortKey ?
                circleSortKey.evaluate(evaluationFeature, {}, canonical) :
                undefined;

            const bucketFeature: BucketFeature = {
                id,
                properties: feature.properties,
                type: feature.type,
                sourceLayerIndex,
                index,
                geometry: needGeometry ? evaluationFeature.geometry : loadGeometry(feature, canonical, tileTransform),
                patterns: {},
                sortKey
            };

            bucketFeatures.push(bucketFeature);

        }

        if (circleSortKey) {
            bucketFeatures.sort((a, b) => {
                // a.sortKey is always a number when in use
                return ((a.sortKey: any): number) - ((b.sortKey: any): number);
            });
        }

        for (const bucketFeature of bucketFeatures) {
            const {geometry, index, sourceLayerIndex} = bucketFeature;
            const feature = features[index].feature;
            this.system.addEmitter(geometry[0][0]);
            this.addFeature(bucketFeature, geometry, index, options.availableImages, canonical);
            options.featureIndex.insert(feature, geometry, index, sourceLayerIndex, this.index);
        }
    }

    update(states: FeatureStates, vtLayer: VectorTileLayer, availableImages: Array<string>, imagePositions: {[_: string]: ImagePosition}) {
        this.system.update();
        if (!this.stateDependentLayers.length) return;
        this.programConfigurations.updatePaintArrays(states, vtLayer, this.stateDependentLayers, availableImages, imagePositions);
    }

    isEmpty() {
        return this.layoutVertexArray.length === 0;
    }

    uploadPending() {
        return !this.uploaded || this.programConfigurations.needsUpload;
    }

    upload(context: Context) {
        if (!this.uploaded) {
            this.layoutVertexBuffer = context.createVertexBuffer(this.layoutVertexArray, layoutAttributes);
            this.indexBuffer = context.createIndexBuffer(this.indexArray);
        }
        this.programConfigurations.upload(context);
        this.uploaded = true;
    }

    destroy() {
        if (!this.layoutVertexBuffer) return;
        this.layoutVertexBuffer.destroy();
        this.indexBuffer.destroy();
        this.programConfigurations.destroy();
        this.segments.destroy();
    }

    addFeature(feature: BucketFeature, geometry: Array<Array<Point>>, index: number, availableImages: Array<string>, canonical: CanonicalTileID) {
        if (this.segments.segments.length > 0) {
            return;
        }
        const x = 0;
        const y = 0;

        // this geometry will be of the Point type, and we'll derive
        // two triangles from it.
        //
        // ┌─────────┐
        // │ 3     2 │
        // │         │
        // │ 0     1 │
        // └─────────┘

        const segment = this.segments.prepareSegment(4, this.layoutVertexArray, this.indexArray, feature.sortKey);
        const index2 = segment.vertexLength;

        addCircleVertex(this.layoutVertexArray, x, y, -1, -1);
        addCircleVertex(this.layoutVertexArray, x, y, 1, -1);
        addCircleVertex(this.layoutVertexArray, x, y, 1, 1);
        addCircleVertex(this.layoutVertexArray, x, y, -1, 1);

        this.indexArray.emplaceBack(index2, index2 + 1, index2 + 2);
        this.indexArray.emplaceBack(index2, index2 + 3, index2 + 2);

        segment.vertexLength += 4;
        segment.primitiveLength += 2;

        this.programConfigurations.populatePaintArrays(this.layoutVertexArray.length, feature, index, {}, availableImages, canonical);
    }
}

register('CircleBucket', CircleBucket, {omit: ['layers']});

export default CircleBucket;
