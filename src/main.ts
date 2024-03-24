import Graphic from '@arcgis/core/Graphic';
import Map from '@arcgis/core/Map';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import SceneView from '@arcgis/core/views/SceneView';
import { addFrameTask } from '@arcgis/core/core/scheduling';
import { DroneGraphic } from './drone';
import { DroneMiniView } from './drone-view';
import './style.css';
import { getTimeline, loadMission } from './util';

const location = new Point({
  x: -97.79696873787297,
  y: 30.34998017344233,
  z: 100,
  spatialReference: SpatialReference.WGS84,
});

const map = new Map({
  // basemap: 'dark-gray-vector',
  basemap: 'satellite',
  ground: 'world-elevation',
});

const view = new SceneView({
  container: 'map',
  map: map,
  camera: {
    position: {
      spatialReference: {
        wkid: 102100,
      },
      x: -10886900.116462594,
      y: 3548358.3770633177,
      z: 447.7138755274936,
    },
    heading: 25.353635365080887,
    tilt: 43.27360846322571,
  },
});

const mission = await loadMission('plan-3.dronelink');

const result = await view.map.ground.queryElevation(
  new Point({
    x: mission.plan.takeoffCoordinate.longitude,
    y: mission.plan.takeoffCoordinate.latitude,
  })
);

const takeoffElevation = (result.geometry as Point).z;

const previewView = new DroneMiniView('pip');
const drone = new DroneGraphic({ view, mission });

const estimate = mission.estimate(true);

const allPoints = estimate.allDroneSpatials.map((spatial) => [
  spatial.coordinate.longitude,
  spatial.coordinate.latitude,
  takeoffElevation + spatial.altitude.value,
]);

const graphic = new Graphic({
  geometry: new Polyline({
    paths: [allPoints],
    spatialReference: SpatialReference.WGS84,
  }),
  symbol: {
    type: 'simple-line',
    color: [226, 119, 40],
    width: 2,
  } as any,
});

view.graphics.add(graphic);

const timeline = await getTimeline(mission);

// simple hacky animate for now
let paused = false;
let frameIndex = 0;
let elapsedTime = 0;
setInterval(() => {
  if (paused) return;

  if (frameIndex >= timeline.frames.length) {
    frameIndex = 0;
    elapsedTime = 0;
  }

  const frame = timeline.frames[frameIndex];
  previewView.setFromFrame(frame, takeoffElevation);
  drone.updateFromFrame(frame, takeoffElevation);

  frameIndex++;
}, 50);

const button = document.getElementById('toggle-button')!;
button.addEventListener('click', () => {
  paused = !paused;
  button.setAttribute('paused', paused ? 'true' : 'false');
  button.textContent = paused ? 'Play' : 'Pause';
});
