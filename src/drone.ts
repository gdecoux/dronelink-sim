import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import Symbol3D from '@arcgis/core/symbols/PointSymbol3D';
import { Convert, Mission, TimelineFrame } from 'dronelink-kernel';

interface DroneGraphicProperties {
  view: __esri.SceneView;
  mission: Mission;
}

const droneSymbol: __esri.PointSymbol3DProperties = {
  symbolLayers: [
    {
      type: 'object',
      resource: { href: '/3d/neo-gimbal.glb' },
      width: 1,
      anchor: 'center',
    },
    {
      type: 'object',
      resource: { href: '/3d/neo-drone.glb' },
      castShadows: true,
      width: 5,
      anchor: 'relative',
      anchorPosition: {
        x: 0,
        y: -0.45,
        z: 0,
      },
    },
  ],
};

export class DroneGraphic {
  view: __esri.SceneView;
  mission: Mission;
  graphic: __esri.Graphic;

  constructor({ view, mission }: DroneGraphicProperties) {
    this.view = view;
    this.mission = mission;

    this.graphic = new Graphic({
      geometry: new Point({
        x: mission.plan.takeoffCoordinate.longitude,
        y: mission.plan.takeoffCoordinate.latitude,
        z: 0,
      }),
      symbol: new Symbol3D(droneSymbol),
    });

    view.graphics.add(this.graphic);
  }

  updateFromFrame(frame: TimelineFrame, elevation: number) {
    const spatial = frame.drone.spatial;

    const geometry = this.graphic.geometry.clone() as Point;

    geometry.x = spatial.coordinate.longitude;
    geometry.y = spatial.coordinate.latitude;
    geometry.z = elevation + spatial.altitude.value;

    const symbol = (this.graphic.symbol as Symbol3D).clone();

    const gymbolLayer = symbol.symbolLayers.getItemAt(0) as __esri.ObjectSymbol3DLayer;
    const droneLayer = symbol.symbolLayers.getItemAt(1) as __esri.ObjectSymbol3DLayer;

    droneLayer.heading = 180 + Convert.radiansToDegrees(spatial.orientation.yaw);
    droneLayer.tilt = Convert.radiansToDegrees(spatial.orientation.pitch);
    droneLayer.roll = Convert.radiansToDegrees(spatial.orientation.roll);

    const gimbalOrientation = frame.drone.gimbalOrientation();
    gymbolLayer.heading = 180 + Convert.radiansToDegrees(gimbalOrientation.yaw);
    gymbolLayer.tilt = Convert.radiansToDegrees(gimbalOrientation.pitch);

    this.graphic.geometry = geometry;
    this.graphic.symbol = symbol;
  }

  destroy() {
    this.view.graphics.remove(this.graphic);
    this.graphic.destroy();
  }
}
