export type LocationGroup = {
  label: string;
  items: string[];
};

export const LOCATIONS: Record<string, LocationGroup[]> = {
  USA: [
    {
      label: 'Popular',
      items: [
        'California', 'New York', 'Massachusetts', 'Texas', 'Illinois',
        'Pennsylvania', 'Georgia', 'Washington', 'Florida', 'North Carolina',
        'Michigan', 'Virginia', 'Colorado', 'Maryland', 'New Jersey',
      ],
    },
    {
      label: 'All States',
      items: [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
        'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
        'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
        'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
        'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
        'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
        'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
        'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
        'West Virginia', 'Wisconsin', 'Wyoming', 'Washington D.C.',
      ],
    },
  ],
  UK: [
    {
      label: 'Cities',
      items: [
        'London', 'Manchester', 'Edinburgh', 'Glasgow', 'Birmingham',
        'Bristol', 'Leeds', 'Oxford', 'Cambridge', 'Sheffield',
        'Nottingham', 'Liverpool', 'Newcastle', 'Durham', 'Bath',
        'Cardiff', 'Belfast', 'York', 'Coventry', 'Leicester',
        'Southampton', 'Brighton', 'Exeter', 'Lancaster', 'Loughborough',
        'Aberdeen', 'Dundee', 'Stirling', 'Swansea', 'Bangor',
        'Portsmouth', 'Plymouth', 'Hull', 'Lincoln', 'Salford',
        'Huddersfield', 'Guildford', 'Canterbury', 'Colchester',
        'Hatfield', 'Preston', 'Sunderland', 'Egham', 'Keele',
      ],
    },
  ],
  EU: [
    { label: 'Germany', items: ['Munich', 'Berlin', 'Hamburg', 'Aachen', 'Heidelberg'] },
    { label: 'France', items: ['Paris', 'Palaiseau', 'Jouy-en-Josas'] },
    { label: 'Netherlands', items: ['Amsterdam', 'Delft', 'Leiden', 'Utrecht', 'Eindhoven', 'Rotterdam'] },
    { label: 'Sweden', items: ['Stockholm', 'Uppsala', 'Lund', 'Gothenburg'] },
    { label: 'Denmark', items: ['Copenhagen', 'Aarhus', 'Kongens Lyngby'] },
    { label: 'Switzerland', items: ['Zurich', 'Lausanne'] },
    { label: 'Belgium', items: ['Leuven', 'Ghent'] },
    { label: 'Italy', items: ['Milan', 'Bologna', 'Rome'] },
    { label: 'Spain', items: ['Barcelona', 'Madrid'] },
    { label: 'Finland', items: ['Espoo', 'Helsinki'] },
    { label: 'Austria', items: ['Vienna'] },
    { label: 'Norway', items: ['Oslo'] },
    { label: 'Czech Republic', items: ['Prague'] },
    { label: 'Portugal', items: ['Porto', 'Lisbon'] },
  ],
  China: [
    {
      label: 'Cities',
      items: [
        'Beijing', 'Shanghai', 'Hangzhou', 'Nanjing', 'Wuhan',
        'Guangzhou', 'Harbin', "Xi'an", 'Tianjin', 'Jinan',
        'Dalian', 'Hefei', 'Chengdu', 'Shenzhen', 'Chongqing',
      ],
    },
  ],
};

// Maps full US state name → 2-letter abbreviation (matching College Scorecard data)
export const STATE_ABBREV: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'Washington D.C.': 'DC',
};
