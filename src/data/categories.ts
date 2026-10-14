// 새 분류는 아래 배열에 한 줄 추가하면 목록·분류 페이지가 자동 생성된다.
// color는 tokens.css의 --cat-* 변수 이름이다.
export const categories = [
  { id: 'math', name: '기초수학', description: '선형대수, 확률, 최적화 등 로봇에 필요한 수학', color: 'math' },
  { id: 'robotics', name: '로봇기초', description: '좌표계, 기구학, ROS 2 구조', color: 'robotics' },
  { id: 'perception', name: '인지', description: '카메라·라이다 센서, 비전, 센서 융합', color: 'perception' },
  { id: 'slam', name: 'SLAM / 위치추정', description: '지도 작성, 위치 추정, 루프 클로저', color: 'slam' },
  { id: 'control', name: '제어', description: 'PID, MPC, 경로 계획과 추종', color: 'control' },
  { id: 'learning', name: '학습', description: '강화학습, 모방학습, VLA 모델', color: 'learning' },
  { id: 'simulation', name: '시뮬레이션', description: 'Gazebo, Isaac Sim, sim-to-real', color: 'simulation' },
] as const;

export type Category = (typeof categories)[number];
export type CategoryId = Category['id'];

export const categoryIds = categories.map((c) => c.id) as [CategoryId, ...CategoryId[]];

export function getCategory(id: CategoryId): Category {
  return categories.find((c) => c.id === id)!;
}
