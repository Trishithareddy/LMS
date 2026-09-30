
export const courses = [
  {
    id: '1',
    name: 'Advanced Mathematics',
    description: 'Comprehensive course covering calculus, algebra, and statistical analysis',
    duration: '6 months',
    credits: 6
  },
  {
    id: '2',
    name: 'Computer Science Fundamentals',
    description: 'Introduction to programming, data structures, and algorithms',
    duration: '8 months',
    credits: 8
  },
  {
    id: '3',
    name: 'English Literature',
    description: 'Study of classic and contemporary literature with critical analysis',
    duration: '4 months',
    credits: 4
  },
  {
    id: '4',
    name: 'Physics & Chemistry',
    description: 'Integrated science course covering fundamental concepts',
    duration: '12 months',
    credits: 12
  }
];

export const students = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.johnson@email.com',
    phone: '+1 (555) 123-4567',
    enrollmentDate: '2024-01-15',
    status: 'active',
    grade: 'A',
    batchId: '1'
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob.smith@email.com',
    phone: '+1 (555) 234-5678',
    enrollmentDate: '2024-01-20',
    status: 'active',
    grade: 'B+',
    batchId: '1'
  },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol.williams@email.com',
    phone: '+1 (555) 345-6789',
    enrollmentDate: '2024-02-01',
    status: 'active',
    grade: 'A-',
    batchId: '2'
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david.brown@email.com',
    phone: '+1 (555) 456-7890',
    enrollmentDate: '2024-02-10',
    status: 'active',
    grade: 'B',
    batchId: '2'
  },
  {
    id: '5',
    name: 'Emma Davis',
    email: 'emma.davis@email.com',
    phone: '+1 (555) 567-8901',
    enrollmentDate: '2024-02-15',
    status: 'active',
    grade: 'A',
    batchId: '3'
  },
  {
    id: '6',
    name: 'Frank Wilson',
    email: 'frank.wilson@email.com',
    phone: '+1 (555) 678-9012',
    enrollmentDate: '2024-03-01',
    status: 'active',
    grade: 'B+',
    batchId: '3'
  }
];

export const teachers = [
  {
    id: '1',
    name: 'Dr. Sarah Martinez',
    email: 'sarah.martinez@school.edu',
    phone: '+1 (555) 111-2222',
    subject: 'Mathematics',
    experience: 8,
    status: 'active',
    batchIds: ['1', '4']
  },
  {
    id: '2',
    name: 'Prof. Michael Chen',
    email: 'michael.chen@school.edu',
    phone: '+1 (555) 222-3333',
    subject: 'Computer Science',
    experience: 12,
    status: 'active',
    batchIds: ['2']
  },
  {
    id: '3',
    name: 'Dr. Jennifer Taylor',
    email: 'jennifer.taylor@school.edu',
    phone: '+1 (555) 333-4444',
    subject: 'English Literature',
    experience: 6,
    status: 'active',
    batchIds: ['3']
  },
  {
    id: '4',
    name: 'Dr. Robert Lee',
    email: 'robert.lee@school.edu',
    phone: '+1 (555) 444-5555',
    subject: 'Physics',
    experience: 10,
    status: 'active',
    batchIds: ['4']
  }
];

export const batches = [
  {
    id: '1',
    name: 'Math Advanced 2024-A',
    courseId: '1',
    course: courses[0],
    startDate: '2024-01-15',
    endDate: '2024-07-15',
    studentIds: ['1', '2'],
    teacherIds: ['1'],
    status: 'active'
  },
  {
    id: '2',
    name: 'CS Fundamentals 2024-B',
    courseId: '2',
    course: courses[1],
    startDate: '2024-02-01',
    endDate: '2024-09-30',
    studentIds: ['3', '4'],
    teacherIds: ['2'],
    status: 'active'
  },
  {
    id: '3',
    name: 'English Lit 2024-A',
    courseId: '3',
    course: courses[2],
    startDate: '2024-02-15',
    endDate: '2024-06-15',
    studentIds: ['5', '6'],
    teacherIds: ['3'],
    status: 'active'
  },
  {
    id: '4',
    name: 'Physics & Chem 2024-C',
    courseId: '4',
    course: courses[3],
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    studentIds: [],
    teacherIds: ['1', '4'],
    status: 'upcoming'
  }
];