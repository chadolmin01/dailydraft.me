import * as THREE from 'three';
import { geoMercator } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology, GeometryObject } from 'topojson-specification';

// 대한민국 중심 기준 Mercator 프로젝션
// 화면 좌표계로 변환 (Three.js 좌표: x=동서, z=남북)
const PROJECTION_CENTER: [number, number] = [127.5, 36.0];
const PROJECTION_SCALE = 70;

const projection = geoMercator()
  .center(PROJECTION_CENTER)
  .scale(PROJECTION_SCALE)
  .translate([0, 0]);

export interface ProvinceData {
  name: string;
  nameEng: string;
  code: string;
  shape: THREE.Shape;
  center: [number, number];
}

/**
 * lat/lng → Three.js 월드 좌표 (x, z)
 * y축은 높이로 사용
 */
export function latLngToWorld(lat: number, lng: number): [number, number] {
  const projected = projection([lng, lat]);
  if (!projected) return [0, 0];
  // KoreaMap group rotation[-π/2,0,0] 후 world z = -shape.y = projected[1]
  // 마커도 동일하게 projected[1]을 z로 사용해야 지도와 정렬됨
  return [projected[0], projected[1]];
}

/**
 * TopoJSON → 도/광역시별 THREE.Shape 배열 변환
 */
export function parseKoreaTopology(topoData: Topology): ProvinceData[] {
  const objectKey = Object.keys(topoData.objects)[0];
  const geojson = topojson.feature(
    topoData,
    topoData.objects[objectKey] as GeometryObject
  );

  const provinces: ProvinceData[] = [];

  if (geojson.type !== 'FeatureCollection') return provinces;

  for (const feature of geojson.features) {
    const props = feature.properties as {
      name: string;
      name_eng: string;
      code: string;
    };

    const shapes = featureToShapes(feature);
    if (shapes.length === 0) continue;

    // 가장 큰 폴리곤을 대표 shape으로 (섬 제외)
    const mainShape = shapes.reduce((a, b) => {
      const areaA = Math.abs(THREE.ShapeUtils.area(a.getPoints()));
      const areaB = Math.abs(THREE.ShapeUtils.area(b.getPoints()));
      return areaA > areaB ? a : b;
    });

    // 도 중심 좌표 계산 (폴리곤 바운딩박스 중심)
    const points = mainShape.getPoints();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // 모든 shape(섬 포함) 합치기 — holes 처리는 생략 (단순화 버전)
    provinces.push({
      name: props.name,
      nameEng: props.name_eng,
      code: props.code,
      shape: mainShape,
      center: [(minX + maxX) / 2, (minY + maxY) / 2],
    });
  }

  return provinces;
}

function featureToShapes(feature: GeoJSON.Feature): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  const geometry = feature.geometry;

  if (geometry.type === 'Polygon') {
    const shape = ringToShape(geometry.coordinates[0]);
    if (shape) shapes.push(shape);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      const shape = ringToShape(polygon[0]);
      if (shape) shapes.push(shape);
    }
  }

  return shapes;
}

function ringToShape(ring: number[][]): THREE.Shape | null {
  if (ring.length < 3) return null;

  const shape = new THREE.Shape();
  const first = projection(ring[0] as [number, number]);
  if (!first) return null;

  shape.moveTo(first[0], -first[1]);

  for (let i = 1; i < ring.length; i++) {
    const point = projection(ring[i] as [number, number]);
    if (point) {
      shape.lineTo(point[0], -point[1]);
    }
  }

  shape.closePath();
  return shape;
}
