export interface Question {
  id: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctAnswer: number; // index 0-3
  explanation: string;
  marks: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
  topic: string;
  type: 'Note' | 'PDF' | 'Diagram' | 'Video';
  content: string; // Markdown content or URL description
  url?: string;
}

export interface TestAttempt {
  id: string;
  testId: string;
  testName: string;
  date: string;
  score: number;
  maxScore: number;
  timeSpent: number; // in seconds
  accuracy: number; // percentage
  answers: { [questionId: string]: { selected: number; isCorrect: boolean; timeTaken: number } };
  feedback?: {
    instructorName: string;
    text: string;
    date: string;
    aiSuggestions: string[];
  };
}

export interface MockTest {
  id: string;
  name: string;
  duration: number; // in minutes
  subjects: ('Physics' | 'Chemistry' | 'Mathematics' | 'Biology')[];
  questions: Question[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  studentId?: string; // for parent linkages
  streak?: number;
  weakTopics?: string[];
  strongTopics?: string[];
  loginDates?: string[]; // ISO Date strings
}

// 1. Initial MCQ Seed Database (MHT-CET Level PCMB Questions)
export const initialQuestions: Question[] = [
  // Physics Questions
  {
    id: 'p1',
    subject: 'Physics',
    topic: 'Rotational Dynamics',
    difficulty: 'Medium',
    question: 'A thin uniform circular ring of mass M and radius R is rotating about its geometric axis with a constant angular velocity omega. If two objects, each of mass m, are attached gently to the opposite ends of a diameter of the ring, what is the new angular velocity of the ring?',
    options: [
      'M * omega / (M + 2m)',
      '(M + 2m) * omega / M',
      'M * omega / (M + m)',
      '(M - 2m) * omega / (M + 2m)'
    ],
    correctAnswer: 0,
    explanation: 'By the law of conservation of angular momentum: I1 * omega1 = I2 * omega2. Initial Moment of Inertia I1 = M * R^2. Final Moment of Inertia I2 = M * R^2 + 2 * m * R^2 = (M + 2m) * R^2. Thus, omega2 = (I1 * omega1) / I2 = (M * R^2 * omega) / ((M + 2m) * R^2) = M * omega / (M + 2m).',
    marks: 1
  },
  {
    id: 'p2',
    subject: 'Physics',
    topic: 'Rotational Dynamics',
    difficulty: 'Hard',
    question: 'A solid sphere rolls down an inclined plane of inclination theta without slipping. What is the acceleration of the center of mass of the sphere?',
    options: [
      'g * sin(theta)',
      '(5/7) * g * sin(theta)',
      '(2/3) * g * sin(theta)',
      '(2/7) * g * sin(theta)'
    ],
    correctAnswer: 1,
    explanation: 'For a rolling body, acceleration a = g * sin(theta) / (1 + k^2/R^2). For a solid sphere, the moment of inertia is I = (2/5)*M*R^2, so k^2/R^2 = 2/5. Acceleration a = g * sin(theta) / (1 + 2/5) = g * sin(theta) / (7/5) = (5/7) * g * sin(theta).',
    marks: 1
  },
  {
    id: 'p3',
    subject: 'Physics',
    topic: 'Oscillations',
    difficulty: 'Easy',
    question: 'The total energy of a particle executing simple harmonic motion (SHM) is proportional to:',
    options: [
      'Displacement from mean position',
      'Square of the frequency of oscillation',
      'Square root of the amplitude',
      'Velocity at the mean position'
    ],
    correctAnswer: 1,
    explanation: 'The total energy of a particle in SHM is E = (1/2) * m * omega^2 * A^2 = 2 * pi^2 * m * f^2 * A^2. Therefore, E is directly proportional to the square of the frequency (f^2) and the square of the amplitude (A^2).',
    marks: 1
  },
  {
    id: 'p4',
    subject: 'Physics',
    topic: 'Mechanical Properties of Fluids',
    difficulty: 'Medium',
    question: 'Water rises to a height of 10 cm in a capillary tube of radius r. If the capillary tube is cut at a height of 8 cm, the water will:',
    options: [
      'Overflow like a fountain',
      'Not rise at all',
      'Rise to 8 cm and stay there with an increased radius of curvature at the meniscus',
      'Rise to 8 cm and overflow slowly from the sides'
    ],
    correctAnswer: 2,
    explanation: 'According to Jurin\'s Law, h * r = constant. If the tube is cut to a height h\' < h (8 cm < 10 cm), the water rises to the top of the cut tube (8 cm) and its meniscus adjusts its radius of curvature R\' such that h\' * R\' = h * R, meaning R\' increases. The water will not overflow.',
    marks: 1
  },

  // Chemistry Questions
  {
    id: 'c1',
    subject: 'Chemistry',
    topic: 'Chemical Kinetics',
    difficulty: 'Medium',
    question: 'For a first-order reaction, if the rate constant k is 6.93 x 10^-3 s^-1, what is the time required for 75% completion of the reaction?',
    options: [
      '100 seconds',
      '200 seconds',
      '50 seconds',
      '150 seconds'
    ],
    correctAnswer: 1,
    explanation: 'For a first-order reaction: t_1/2 = 0.693 / k = 0.693 / (6.93 * 10^-3) = 100 s. The time required for 75% completion is equivalent to two half-lives (t_75% = 2 * t_1/2). Therefore, t = 2 * 100 s = 200 seconds.',
    marks: 1
  },
  {
    id: 'c2',
    subject: 'Chemistry',
    topic: 'Chemical Kinetics',
    difficulty: 'Hard',
    question: 'If the activation energy of a reaction is zero, then the rate constant k of the reaction is:',
    options: [
      'Directly proportional to Temperature (T)',
      'Inversely proportional to Temperature (T)',
      'Independent of Temperature (T)',
      'Zero'
    ],
    correctAnswer: 2,
    explanation: 'By the Arrhenius equation: k = A * e^(-Ea / R * T). If Ea = 0, then k = A * e^0 = A. Thus, the rate constant k becomes equal to the pre-exponential factor A and is completely independent of temperature T.',
    marks: 1
  },
  {
    id: 'c3',
    subject: 'Chemistry',
    topic: 'Solid State',
    difficulty: 'Easy',
    question: 'What is the coordination number of atoms in a body-centered cubic (BCC) crystal structure?',
    options: [
      '6',
      '8',
      '12',
      '4'
    ],
    correctAnswer: 1,
    explanation: 'In a body-centered cubic (BCC) unit cell, the atom at the body center is in direct contact with the eight atoms located at the eight corners of the cube. Therefore, the coordination number is 8.',
    marks: 1
  },
  {
    id: 'c4',
    subject: 'Chemistry',
    topic: 'Coordination Compounds',
    difficulty: 'Medium',
    question: 'According to Crystal Field Theory, the d-orbital splitting pattern for an octahedral coordination complex splits the d-orbitals into which energy levels?',
    options: [
      't2g (lower energy) and eg (higher energy)',
      'eg (lower energy) and t2g (higher energy)',
      't2 (lower energy) and e (higher energy)',
      'All five d-orbitals remain degenerate'
    ],
    correctAnswer: 0,
    explanation: 'In an octahedral field, ligands approach along the x, y, and z axes. Orbitals pointing directly at ligands (dx2-y2, dz2) experience greater repulsion and rise in energy (eg level). Orbitals lying between axes (dxy, dyz, dxz) experience less repulsion and decrease in energy (t2g level).',
    marks: 1
  },

  // Mathematics Questions
  {
    id: 'm1',
    subject: 'Mathematics',
    topic: 'Vectors',
    difficulty: 'Medium',
    question: 'Find the area of the parallelogram whose diagonals are represented by the vectors d1 = 3i + j - 2k and d2 = i - 3j + 4k.',
    options: [
      '5 * sqrt(3) sq. units',
      'sqrt(300) sq. units',
      '5 * sqrt(2) sq. units',
      '5 * sqrt(3) / 2 sq. units'
    ],
    correctAnswer: 0,
    explanation: 'The area of a parallelogram given its diagonals is (1/2) * |d1 x d2|. First, calculate the cross product: d1 x d2 = det([i, j, k; 3, 1, -2; 1, -3, 4]) = i(4 - 6) - j(12 - (-2)) + k(-9 - 1) = -2i - 14j - 10k. The magnitude of d1 x d2 = sqrt((-2)^2 + (-14)^2 + (-10)^2) = sqrt(4 + 196 + 100) = sqrt(300) = 10 * sqrt(3). Area = (1/2) * 10 * sqrt(3) = 5 * sqrt(3) sq. units.',
    marks: 2
  },
  {
    id: 'm2',
    subject: 'Mathematics',
    topic: 'Integration',
    difficulty: 'Hard',
    question: 'Evaluate the definite integral: Integrate[ sin^2(x) / (sin(x) + cos(x)) dx ] from 0 to pi/2.',
    options: [
      'pi / (2 * sqrt(2))',
      '(1 / sqrt(2)) * log(sqrt(2) + 1)',
      '(1 / (2 * sqrt(2))) * log(sqrt(2) + 1)',
      'pi / 4'
    ],
    correctAnswer: 2,
    explanation: 'Let I = Integrate[ sin^2(x)/(sin(x)+cos(x)) dx ]. Using King\'s property, replacement of x with pi/2 - x gives: I = Integrate[ cos^2(x)/(sin(x)+cos(x)) dx ]. Adding both, 2I = Integrate[ (sin^2(x)+cos^2(x))/(sin(x)+cos(x)) dx ] = Integrate[ 1/(sin(x)+cos(x)) dx ]. Using formula sin(x)+cos(x) = sqrt(2)*sin(x+pi/4), we get 2I = (1/sqrt(2)) * [log|csc(x+pi/4) - cot(x+pi/4)|] evaluated from 0 to pi/2. Solving the bounds gives 2I = (1/sqrt(2)) * log(sqrt(2)+1), hence I = (1/(2*sqrt(2))) * log(sqrt(2)+1).',
    marks: 2
  },
  {
    id: 'm3',
    subject: 'Mathematics',
    topic: 'Trigonometric Functions',
    difficulty: 'Easy',
    question: 'The principal value of sin^-1(-1/2) is:',
    options: [
      '-pi / 6',
      '7 * pi / 6',
      '11 * pi / 6',
      '-pi / 3'
    ],
    correctAnswer: 0,
    explanation: 'The range of the principal value branch of sin^-1(x) is [-pi/2, pi/2]. Since sin(-pi/6) = -1/2 and -pi/6 belongs to the interval [-pi/2, pi/2], the principal value is -pi/6.',
    marks: 2
  },

  // Biology Questions
  {
    id: 'b1',
    subject: 'Biology',
    topic: 'Inheritance and Variation',
    difficulty: 'Medium',
    question: 'A cross between a red-flowered plant and a white-flowered plant produces all pink-flowered F1 offspring. When F1 plants are self-pollinated, the phenotypic ratio in F2 is 1:2:1 (Red:Pink:White). This is an example of:',
    options: [
      'Complete Dominance',
      'Codominance',
      'Incomplete Dominance',
      'Epistasis'
    ],
    correctAnswer: 2,
    explanation: 'In incomplete dominance, the dominant allele does not completely mask the recessive allele, resulting in a heterozygous phenotype that is an intermediate blend of the two homozygous phenotypes (Red + White = Pink). The F2 ratio is 1 Red (RR) : 2 Pink (Rr) : 1 White (rr).',
    marks: 1
  },
  {
    id: 'b2',
    subject: 'Biology',
    topic: 'Photosynthesis',
    difficulty: 'Hard',
    question: 'During the light reaction of photosynthesis, the primary electron donor for photophosphorylation is:',
    options: [
      'Carbon dioxide',
      'NADP+',
      'Water',
      'Chlorophyll a (P700)'
    ],
    correctAnswer: 2,
    explanation: 'Water molecules undergo photolysis in Photosystem II (PSII) to release oxygen, protons, and electrons: 2H2O -> O2 + 4H+ + 4e-. These electrons replace the excited electrons lost by the reaction center chlorophyll a (P680) of PSII, making water the primary electron donor.',
    marks: 1
  },
  {
    id: 'b3',
    subject: 'Biology',
    topic: 'Respiration and Energy Transfer',
    difficulty: 'Easy',
    question: 'How many net ATP molecules are produced during glycolysis of a single glucose molecule?',
    options: [
      '38 ATP',
      '2 ATP',
      '4 ATP',
      '36 ATP'
    ],
    correctAnswer: 1,
    explanation: 'Glycolysis yields a gross total of 4 ATP molecules. However, 2 ATP molecules are consumed in the preparatory phase (phosphorylation steps). Thus, the net gain of ATP molecules during glycolysis is 2 ATP (4 - 2 = 2).',
    marks: 1
  }
];

// 2. Initial Mock Test Templates
export const initialMockTests: MockTest[] = [
  {
    id: 't1',
    name: 'MHT-CET PCMB Full Syllabus Test 1',
    duration: 180,
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    questions: [
      initialQuestions[0], // p1
      initialQuestions[1], // p2
      initialQuestions[2], // p3
      initialQuestions[3], // p4
      initialQuestions[4], // c1
      initialQuestions[5], // c2
      initialQuestions[6], // c3
      initialQuestions[7], // c4
      initialQuestions[8], // m1
      initialQuestions[9], // m2
      initialQuestions[10], // m3
      initialQuestions[11], // b1
      initialQuestions[12], // b2
      initialQuestions[13]  // b3
    ]
  },
  {
    id: 't2',
    name: 'Physics & Chemistry Chapterwise Mock 1',
    duration: 90,
    subjects: ['Physics', 'Chemistry'],
    questions: [
      initialQuestions[0],
      initialQuestions[1],
      initialQuestions[2],
      initialQuestions[3],
      initialQuestions[4],
      initialQuestions[5],
      initialQuestions[6],
      initialQuestions[7]
    ]
  },
  {
    id: 't3',
    name: 'Mathematics Special Vectors & Calculus Mock',
    duration: 90,
    subjects: ['Mathematics'],
    questions: [
      initialQuestions[8],
      initialQuestions[9],
      initialQuestions[10]
    ]
  }
];

// 3. Initial Study Materials (Markdown notes, embedded references)
export const initialStudyMaterials: StudyMaterial[] = [
  {
    id: 'sm1',
    title: 'Rotational Dynamics: Core Equations & Derivations',
    subject: 'Physics',
    topic: 'Rotational Dynamics',
    type: 'Note',
    content: `### Rotational Dynamics Summary
1. **Angular Displacement (theta)**: Measured in radians.
2. **Angular Velocity (omega)**: \\( \\omega = \\frac{d\\theta}{dt} \\) (rad/s).
3. **Angular Acceleration (alpha)**: \\( \\alpha = \\frac{d\\omega}{dt} \\) (rad/s²).
4. **Centripetal Acceleration**: \\( a_c = r\\omega^2 = \\frac{v^2}{r} \\) directed towards the center.
5. **Moment of Inertia (I)**: \\( I = \\sum m_i r_i^2 \\).
   - Ring about central axis: \\( I = MR^2 \\)
   - Disc about central axis: \\( I = \\frac{1}{2}MR^2 \\)
   - Solid Sphere: \\( I = \\frac{2}{5}MR^2 \\)
   - Hollow Sphere: \\( I = \\frac{2}{3}MR^2 \\)
6. **Rolling Motion**: Total Kinetic Energy \\( E_k = E_{trans} + E_{rot} = \\frac{1}{2}Mv^2 (1 + \\frac{k^2}{R^2}) \\) where k is radius of gyration.
7. **Conservation of Angular Momentum**: If net external torque is zero, \\( L = I\\omega = \\text{constant} \\).`
  },
  {
    id: 'sm2',
    title: 'Chemical Kinetics: Integrated Rate Laws Study Guide',
    subject: 'Chemistry',
    topic: 'Chemical Kinetics',
    type: 'Note',
    content: `### Chemical Kinetics Study Note
- **Rate of Reaction**: \\( \\text{Rate} = -\\frac{d[A]}{dt} = k[A]^n \\)
- **Zero Order Kinetics**:
  - Integrated Rate Equation: \\( [A]_t = -kt + [A]_0 \\)
  - Half-life: \\( t_{1/2} = \\frac{[A]_0}{2k} \\)
  - Units of k: \\( \\text{mol L}^{-1} \\text{s}^{-1} \\)
- **First Order Kinetics**:
  - Integrated Rate Equation: \\( k = \\frac{2.303}{t} \\log \\frac{[A]_0}{[A]_t} \\)
  - Half-life: \\( t_{1/2} = \\frac{0.693}{k} \\) (Independent of initial concentration)
  - Units of k: \\( \\text{s}^{-1} \\)
- **Arrhenius Equation**: \\( k = A e^{-E_a / RT} \\)
  - Logarithmic form: \\( \\log \\frac{k_2}{k_1} = \\frac{E_a}{2.303 R} \\left( \\frac{T_2 - T_1}{T_1 T_2} \\right) \\)`
  },
  {
    id: 'sm3',
    title: 'Integration Cheat Sheet for MHT-CET',
    subject: 'Mathematics',
    topic: 'Integration',
    type: 'PDF',
    content: 'Full integration formula notes covering indefinite integral substitutions, standard algebraic forms, integration by parts (LIATE rule), and key definite integration properties (e.g., King\'s property, Queen\'s property).',
    url: 'https://education.maharashtra.gov.in/syllabus/integration_notes.pdf'
  },
  {
    id: 'sm4',
    title: 'Photosynthesis Light Reactions Diagram',
    subject: 'Biology',
    topic: 'Photosynthesis',
    type: 'Diagram',
    content: 'Diagram showcasing the Z-scheme of light reactions, illustrating the flow of electrons from H2O to PS II, Cytochrome b6f complex, PS I, and finally to NADP+ reductase, with the generation of ATP via ATP synthase.',
    url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d'
  }
];

// 4. Initial Student Attempts & Performance History
export const initialAttempts: TestAttempt[] = [
  {
    id: 'att1',
    testId: 't1',
    testName: 'MHT-CET PCMB Full Syllabus Test 1',
    date: '2026-06-12',
    score: 11,
    maxScore: 17, // 11 MCQs P/C/B (1 mark each) + 3 MCQs M (2 marks each) => 4 + 4 + 6 + 3 = 17 marks
    timeSpent: 3600, // 60 mins
    accuracy: 64,
    answers: {
      'p1': { selected: 0, isCorrect: true, timeTaken: 250 },
      'p2': { selected: 0, isCorrect: false, timeTaken: 350 }, // Weakness identified in Rotational Dynamics
      'p3': { selected: 1, isCorrect: true, timeTaken: 120 },
      'p4': { selected: 1, isCorrect: false, timeTaken: 220 }, // Weakness in Fluids
      'c1': { selected: 1, isCorrect: true, timeTaken: 180 },
      'c2': { selected: 0, isCorrect: false, timeTaken: 300 }, // Weakness in Chemical Kinetics
      'c3': { selected: 1, isCorrect: true, timeTaken: 80 },
      'c4': { selected: 0, isCorrect: true, timeTaken: 190 },
      'm1': { selected: 1, isCorrect: false, timeTaken: 400 }, // Weakness in Vectors
      'm2': { selected: 2, isCorrect: true, timeTaken: 550 },
      'm3': { selected: 0, isCorrect: true, timeTaken: 120 },
      'b1': { selected: 2, isCorrect: true, timeTaken: 90 },
      'b2': { selected: 3, isCorrect: false, timeTaken: 150 }, // Weakness in Photosynthesis
      'b3': { selected: 1, isCorrect: true, timeTaken: 70 }
    },
    feedback: {
      instructorName: 'Prof. Sharma',
      text: 'Good performance overall, Rahul. Your math calculus questions are sharp, but vectors and rotational dynamics formulas need direct practice. Revise rolling acceleration rules and cross-product area properties.',
      date: '2026-06-13',
      aiSuggestions: [
        'Time spent on vectors (400s) was high but ended in an error. Focus on cross-product visualization.',
        'Rotational dynamics: Re-verify formulas for inertia values of solid/hollow spheres.',
        'Fluids meniscus: Review Jurin\'s law height limits.'
      ]
    }
  },
  {
    id: 'att2',
    testId: 't3',
    testName: 'Mathematics Special Vectors & Calculus Mock',
    date: '2026-06-15',
    score: 4,
    maxScore: 6, // 3 questions (2 marks each)
    timeSpent: 900, // 15 mins
    accuracy: 66,
    answers: {
      'm1': { selected: 0, isCorrect: true, timeTaken: 200 }, // Vector parallelogram corrected
      'm2': { selected: 0, isCorrect: false, timeTaken: 500 }, // Calculus remains difficult
      'm3': { selected: 0, isCorrect: true, timeTaken: 100 }
    },
    feedback: {
      instructorName: 'Prof. Sharma',
      text: 'Vector correction shows you revised the cross-product rules! Good job. Integration remains a bit challenging under time pressure. Spend time reviewing integration substitutions.',
      date: '2026-06-16',
      aiSuggestions: [
        'Accuracy on Vectors improved to 100% in this mock.',
        'Integration bounds took 500 seconds. Study the trigonometric substitution forms.'
      ]
    }
  }
];

// 5. Calendar Events for Prep
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'Test' | 'Lecture' | 'Target';
  subject?: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'General';
}

export const initialEvents: CalendarEvent[] = [
  { id: 'e1', title: 'Grand Mock Test 2 (PCMB)', date: '2026-06-20', type: 'Test', subject: 'General' },
  { id: 'e2', title: 'Live Doubt Session - Calculus & Kinetics', date: '2026-06-22', type: 'Lecture', subject: 'Mathematics' },
  { id: 'e3', title: 'Daily Target: Wave Optics notes reading', date: '2026-06-19', type: 'Target', subject: 'Physics' },
  { id: 'e4', title: 'Revision of Reproduction in Plants', date: '2026-06-18', type: 'Target', subject: 'Biology' },
  { id: 'e5', title: 'Chemistry coordination nomenclature quiz', date: '2026-06-21', type: 'Test', subject: 'Chemistry' }
];

// 6. User Notes Canvas Database
export interface UserNote {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
  topic: string;
  content: string;
  lastUpdated: string;
}

export const initialNotes: UserNote[] = [
  {
    id: 'n1',
    title: 'My Notes: Vectors Dot & Cross Products',
    subject: 'Mathematics',
    topic: 'Vectors',
    content: `# Vectors Quick Notes
- A dot B = |A||B| cos(theta)
- A x B = |A||B| sin(theta) n_hat
- Cross product is perpendicular to the plane of both vectors.
- Area of triangle = 1/2 * |a x b|
- Area of parallelogram = |a x b|
- If diagonals are given, Area = 1/2 * |d1 x d2|`,
    lastUpdated: '2026-06-15'
  },
  {
    id: 'n2',
    title: 'Kinetic Theory of Gases & Radiation Formulas',
    subject: 'Physics',
    topic: 'Oscillations',
    content: `# KTG Key Relations
- Pressure of gas P = (1/3) * (N * m * v_rms^2) / V
- Average kinetic energy of molecule = (3/2) * k_B * T
- Root Mean Square Velocity v_rms = sqrt( 3 * R * T / M )
- Stefan-Boltzmann Law: E = sigma * T^4`,
    lastUpdated: '2026-06-14'
  }
];

// 7. Mock Users
export const mockUsers: UserProfile[] = [
  {
    id: 'u_student',
    name: 'Rahul Sharma',
    email: 'rahul@cet.com',
    role: 'student',
    streak: 12,
    weakTopics: ['Rotational Dynamics', 'Chemical Kinetics', 'Vectors', 'Photosynthesis'],
    strongTopics: ['Oscillations', 'Solid State', 'Trigonometric Functions', 'Respiration and Energy Transfer'],
    loginDates: [
      '2026-06-18', '2026-06-17', '2026-06-16', '2026-06-15', '2026-06-14',
      '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09',
      '2026-06-08', '2026-06-07', '2026-06-05', '2026-06-04', '2026-06-03',
      '2026-06-01', '2026-05-30', '2026-05-29', '2026-05-28'
    ]
  },
  {
    id: 'u_parent',
    name: 'Mr. Arvind Sharma',
    email: 'parent.rahul@cet.com',
    role: 'parent',
    studentId: 'u_student'
  },
  {
    id: 'u_admin',
    name: 'Prof. Sharma (Admin)',
    email: 'sharma.sir@cet.com',
    role: 'admin'
  }
];
