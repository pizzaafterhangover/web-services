// 새 분류는 아래 배열에 한 줄 추가하면 목록·분류 페이지가 자동 생성된다.
// color는 tokens.css의 --cat-* 변수 이름이다.
// parent를 지정하면 그 분류의 하위 분류가 된다(한 단계만).
const definitions = [
  { id: 'math', name: '기초수학', description: '선형대수, 확률, 최적화 등 로봇에 필요한 수학', color: 'math' },
  { id: 'robotics', name: '로봇기초', description: '좌표계, 기구학, ROS 2 구조', color: 'robotics' },
  { id: 'ros2', name: 'ROS 2', description: '개발환경, 패키지와 빌드, ROS 2 기반 실습', color: 'ros2' },
  { id: 'perception', name: '인지', description: '카메라·라이다 센서, 비전, 센서 융합', color: 'perception' },
  { id: 'slam', name: 'SLAM / 위치추정', description: '지도 작성, 위치 추정, 루프 클로저', color: 'slam', parent: 'ros2' },
  { id: 'nav2', name: 'Nav2 / 자율주행', description: '위치 추정(AMCL), 경로 계획, 경로 추종, Costmap', color: 'nav2', parent: 'ros2' },
  { id: 'project', name: '프로젝트', description: '팀 프로젝트의 ROS 2 시스템 설계와 진행 기록', color: 'project', parent: 'ros2' },
  { id: 'control', name: '제어', description: 'PID, MPC, 경로 계획과 추종', color: 'control' },
  { id: 'learning', name: '학습', description: '강화학습, 모방학습, VLA 모델', color: 'learning' },
  { id: 'simulation', name: '시뮬레이션', description: 'Gazebo, Isaac Sim, sim-to-real', color: 'simulation' },
] as const;

export type CategoryId = (typeof definitions)[number]['id'];

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  color: string;
  parent?: CategoryId;
}

export const categories: readonly Category[] = definitions;

export const categoryIds = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export const topLevelCategories = categories.filter((c) => !c.parent);

export function getCategory(id: CategoryId): Category {
  return categories.find((c) => c.id === id)!;
}

export function childCategories(id: CategoryId): Category[] {
  return categories.filter((c) => c.parent === id);
}

/** 자기 자신과 하위 분류 id. 상위 분류 페이지에서 하위 분류의 글까지 모을 때 쓴다. */
export function categoryWithChildren(id: CategoryId): CategoryId[] {
  return [id, ...childCategories(id).map((c) => c.id)];
}
