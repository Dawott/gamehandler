export const GAME_SYSTEMS = [
  'Dungeons & Dragons',
  'Pathfinder',
  'Call of Cthulhu',
  'Cyberpunk 2077',
  'Warhammer FRP',
  'Gry Różne - PC',
  'Gry Różne - Konsole',
  'Magic: The Gathering',
  'Warhammer 40k',
  'Pokemon TCG',
  'Wampir: Maskarada',
  'Wilkołak: Apokalipsa',
  'Planszówki - Strategie',
  'Magic: The Gathering',
  'Pathfinder'
]

export const LOCATIONS = [
  'Warszawa', 'Kraków', 'Gdańsk', 'Wrocław', 'Poznań', 'Łódż', 'Rzeszów', 'Lublin', 
  'Katowice',
  'Online'
]

export const MEETING_TIME_OPTIONS = [
  'Wieczór - Dni Powszedni',
  'Weekendy', 
  'Wieczór - Weekendy',
  'Dowolny',
  'Wybrane daty (TBD)'
]

export const TEAM_ROLES = {
  OWNER: 'owner',
  MEMBER: 'member'
} as const

export const JOIN_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected'
} as const