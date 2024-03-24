import { Mission, Serialization } from 'dronelink-kernel';

export async function loadMission(url: string) {
  const _data = await fetch(url).then(async (res) => {
    return res.text();
  });
  const data = Serialization.decompress(_data);
  const component = Serialization.deserialize(data);
  const mission = Mission.createFromComponent(component);

  return mission;
}
