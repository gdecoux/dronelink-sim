import Graphic from '@arcgis/core/Graphic';
import Polyline from '@arcgis/core/geometry/Polyline';
import { Mission, Serialization } from 'dronelink-kernel';

const data = await Bun.file('plan-3.dronelink').text();

const plan = Serialization.decompress(data);
const component = Serialization.deserialize(plan);
const mission = Mission.createFromComponent(component);

const takeoff = mission.plan.takeoffCoordinate;
const estimate = mission.estimate(true);

const allPoints = estimate.allDroneSpatials.map((spatial) => [
  spatial.coordinate.longitude,
  spatial.coordinate.latitude,
  spatial.altitude.value,
]);

const estimateGraphic = new Graphic({
  geometry: new Polyline({
    paths: [allPoints],
    spatialReference: { wkid: 4326 },
  }),
  symbol: {
    type: 'simple-line',
    color: [226, 119, 40],
    width: 2,
  },
  attributes: {
    name: mission.descriptors?.name || 'Mission',
  },
});

console.log(estimateGraphic.toJSON());

// because dronelink is stupid
process.exit(0);
