export type MajorCategory = {
  label: string;
  majors: string[];
};

export const MAJOR_CATEGORIES: MajorCategory[] = [
  {
    label: 'Computer & Technology',
    majors: [
      'Computer Science', 'Software Engineering', 'Data Science', 'Artificial Intelligence',
      'Machine Learning', 'Cybersecurity', 'Information Technology', 'Computer Engineering',
      'Data Engineering', 'Robotics', 'Bioinformatics', 'Game Design', 'Human-Computer Interaction',
    ],
  },
  {
    label: 'Engineering',
    majors: [
      'Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
      'Chemical Engineering', 'Biomedical Engineering', 'Aerospace Engineering',
      'Environmental Engineering', 'Materials Science', 'Nuclear Engineering', 'Industrial Engineering',
      'Systems Engineering', 'Petroleum Engineering',
    ],
  },
  {
    label: 'Sciences',
    majors: [
      'Mathematics', 'Statistics', 'Physics', 'Chemistry', 'Biology', 'Biochemistry',
      'Biotechnology', 'Environmental Science', 'Earth Science', 'Astronomy', 'Neuroscience',
      'Cognitive Science', 'Genetics', 'Microbiology', 'Molecular Biology', 'Food Science',
      'Climate Science', 'Ecology', 'Marine Biology', 'Astrophysics',
    ],
  },
  {
    label: 'Business & Economics',
    majors: [
      'Business', 'Economics', 'Finance', 'Accounting', 'Marketing', 'Management',
      'International Business', 'Entrepreneurship', 'Business Analytics', 'Digital Marketing',
      'Human Resources', 'Operations Management', 'Supply Chain Management', 'Real Estate',
      'Investment Banking', 'Financial Engineering', 'E-Commerce', 'Actuarial Science',
    ],
  },
  {
    label: 'Social Sciences',
    majors: [
      'Psychology', 'Sociology', 'Political Science', 'Anthropology', 'Geography',
      'Criminology', 'Social Work', 'International Relations', 'Development Studies',
      'Gender Studies', 'Public Policy', 'Public Administration', 'Urban Planning',
      'Human Rights', 'Peace Studies', 'Demography',
    ],
  },
  {
    label: 'Humanities & Arts',
    majors: [
      'Humanities', 'History', 'Philosophy', 'English', 'Literature', 'Linguistics',
      'Communications', 'Journalism', 'Media Studies', 'Film', 'Theater', 'Art', 'Design',
      'Music', 'Architecture', 'Liberal Arts', 'Creative Writing', 'Cultural Studies',
      'Classical Studies', 'Modern Languages', 'Religious Studies', 'Digital Arts',
      'Graphic Design', 'Fashion Design', 'Interior Design', 'Photography',
    ],
  },
  {
    label: 'Health & Medicine',
    majors: [
      'Medicine', 'Nursing', 'Public Health', 'Pharmacy', 'Dentistry', 'Biomedical Science',
      'Clinical Psychology', 'Epidemiology', 'Healthcare Management', 'Health Informatics',
      'Kinesiology', 'Nutrition', 'Veterinary Science', 'Occupational Therapy',
      'Physical Therapy', 'Radiography', 'Speech Therapy', 'Midwifery',
    ],
  },
  {
    label: 'Law & Policy',
    majors: [
      'Law', 'International Law', 'Criminal Justice', 'Paralegal Studies', 'Criminology',
      'Forensic Science', 'Human Rights Law',
    ],
  },
  {
    label: 'Agriculture & Environment',
    majors: [
      'Agriculture', 'Agribusiness', 'Forestry', 'Environmental Management',
      'Natural Resource Management', 'Sustainable Development', 'Horticulture',
    ],
  },
  {
    label: 'IB Subjects',
    majors: [
      'IB Mathematics', 'IB Physics', 'IB Chemistry', 'IB Biology', 'IB Computer Science',
      'IB Economics', 'IB Business Management', 'IB History', 'IB Geography', 'IB Psychology',
      'IB Philosophy', 'IB Literature', 'IB Visual Arts', 'IB Theatre', 'IB Music', 'IB Film',
      'IB Environmental Systems', 'IB Global Politics', 'IB Sports Science',
    ],
  },
];

// Flat list of all majors for validation / search
export const ALL_MAJORS: string[] = MAJOR_CATEGORIES.flatMap(c => c.majors);
