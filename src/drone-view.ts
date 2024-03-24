import Map from '@arcgis/core/Map';
import SpatialReference from '@arcgis/core/geometry/SpatialReference';
import SceneView from '@arcgis/core/views/SceneView';
import { Convert, TimelineFrame } from 'dronelink-kernel';

export class DroneMiniView {
  view: SceneView;

  constructor(container: string) {
    const map = new Map({
      basemap: 'satellite',
      ground: 'world-elevation',
    });

    this.view = new SceneView({
      container,
      map,
      ui: {
        components: [],
      },
      camera: {
        position: {
          x: -10886708.7610257164,
          y: 3548322.8948954,
          z: 353.23927236907184,
          spatialReference: SpatialReference.WebMercator,
        },
        tilt: 45,
        heading: 0,
      },
    });

    // disable navigation
    this.view.on('drag', (event) => event.stopPropagation());
    this.view.on('double-click', (event) => event.stopPropagation());
    this.view.on('mouse-wheel', (event) => event.stopPropagation());
  }

  setFromFrame(frame: TimelineFrame, elevation: number) {
    const spatial = frame.drone.spatial;
    const orientation = frame.drone.gimbalOrientation();

    const heading = Convert.radiansToDegrees(orientation.yaw);
    const tilt = Convert.radiansToDegrees(orientation.pitch);

    const camera = this.view.camera.clone();
    camera.position.x = spatial.coordinate.longitude;
    camera.position.y = spatial.coordinate.latitude;
    camera.position.z = elevation + spatial.altitude.value;
    camera.position.spatialReference = SpatialReference.WGS84;

    camera.heading = heading;
    camera.tilt = tilt + 90;

    const fov = frame.drone.camera().specification?.fieldOfView.diagonal;
    if (fov) {
      camera.fov = Convert.radiansToDegrees(fov);
    }

    this.view.camera = camera;
  }
}
