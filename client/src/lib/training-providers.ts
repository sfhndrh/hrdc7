export interface TrainingCourse {
  title: string;
  code: string;
  scheme: string;
  claimable: boolean;
  duration: string;
  fee: string;
  mode: string;
  category: string;
}

export interface TrainingProvider {
  name: string;
  registrationNo: string;
  status: string;
  email: string;
  phone: string;
  fax: string;
  website: string;
  address: string;
  state: string;
  description: string;
  courses: TrainingCourse[];
  detailUrl: string;
  scrapedAt: string;
}

export interface ProvidersData {
  scrapedAt: string;
  model: string;
  stats: {
    totalProviders: number;
    totalCourses: number;
    claimableCourses: number;
    providersWithClaimableCourses: number;
    providersWithEmail: number;
    providersWithWebsite: number;
    providersWithAddress: number;
  };
  providers: TrainingProvider[];
}
