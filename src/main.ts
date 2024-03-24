import Graphic from '@arcgis/core/Graphic';
import Map from '@arcgis/core/Map';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import SceneView from '@arcgis/core/views/SceneView';
import { DroneGraphic } from './drone';
import { DroneMiniView } from './drone-view';
import './style.css';
import { loadMission } from './util';

const location = new Point({
  x: -97.79696873787297,
  y: 30.34998017344233,
  z: 100,
  spatialReference: SpatialReference.WGS84,
});

function jsonDump<T extends __esri.JSONSupport>(value: T) {
  console.log(JSON.stringify(value.toJSON(), null, 2));
}

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
      x: -10886659.506281568,
      y: 3548458.7443418144,
      z: 281.8982653878629,
    },
    heading: 64.93411755712467,
    tilt: 52.11175553948697,
  },
});

(window as any).dumpCamera = () => {
  jsonDump(view.camera);
};

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

let paused = false;
mission.simulate(null, null, null, null, (mission, timeline) => {
  if (mission.complete) {
    console.log(timeline.frames.length);

    let index = 0;

    setInterval(() => {
      if (paused) {
        return;
      }
      if (index >= timeline.frames.length) {
        index = 0;
      }

      const frame = timeline.frames[index];

      previewView.setFromFrame(frame, takeoffElevation);
      drone.updateFromFrame(frame, takeoffElevation);

      index++;
    }, 10);

    return false;
  }

  return true;
});

const button = document.getElementById('toggle-button')!;
button.addEventListener('click', () => {
  paused = !paused;
  button.setAttribute('paused', paused ? 'true' : 'false');
  button.textContent = paused ? 'Play' : 'Pause';
});
