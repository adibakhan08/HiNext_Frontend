import { useCallback, useEffect, useState } from 'react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

export const DEFAULT_ANALYTICS_FILTERS = {
  academic_session: '',
  department: '',
  course: '',
  company: '',
  year: '2026',
  start_date: '',
  end_date: '',
};

const INITIAL_OVERVIEW = {
  total_candidates: 0,
  total_placed: 0,
  total_unplaced: 0,
  total_companies: 0,
  active_companies: 0,
  total_drives: 0,
  total_applications: 0,
  placement_rate: 0,
  average_package: 0,
  highest_package: 0,
  lowest_package: 0,
};

const INITIAL_PACKAGES = {
  average_package: 0,
  highest_package: 0,
  lowest_package: 0,
  package_distribution: [],
};

const INITIAL_INTERVIEW_ANALYSIS = {
  total_interviews: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
  rescheduled: 0,
  passed: 0,
  failed: 0,
  on_hold: 0,
  pending: 0,
};

function buildCleanParams(filters = {}) {
  const params = {};
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      params[key] = String(val).trim();
    }
  });
  return params;
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function useAnalyticsData(
  filters,
  { includeExtended = true } = { includeExtended: true }
) {
  const [overview, setOverview] = useState(INITIAL_OVERVIEW);
  const [placementTrends, setPlacementTrends] = useState([]);
  const [applicationTrends, setApplicationTrends] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState({});
  const [departmentWise, setDepartmentWise] = useState([]);
  const [companyWise, setCompanyWise] = useState([]);
  const [packageAnalysis, setPackageAnalysis] = useState(INITIAL_PACKAGES);
  const [drivePerformance, setDrivePerformance] = useState([]);
  const [interviewAnalysis, setInterviewAnalysis] = useState(
    INITIAL_INTERVIEW_ANALYSIS
  );
  const [unplacedStudents, setUnplacedStudents] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [failedEndpointsCount, setFailedEndpointsCount] = useState(0);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setFailedEndpointsCount(0);

    const params = buildCleanParams(filters);
    const ep = API_ENDPOINTS.ADMIN.ANALYTICS;

    const coreRequests = [
      axiosClient.get(ep.OVERVIEW, { params }),
      axiosClient.get(ep.PLACEMENT_TRENDS, { params }),
      axiosClient.get(ep.DEPARTMENT_WISE, { params }),
      axiosClient.get(ep.COMPANY_WISE, { params }),
      axiosClient.get(ep.PACKAGE_ANALYSIS, { params }),
    ];

    const extendedRequests = includeExtended
      ? [
          axiosClient.get(ep.APPLICATION_TRENDS, { params }),
          axiosClient.get(ep.APPLICATION_STATUS, { params }),
          axiosClient.get(ep.DRIVE_PERFORMANCE, { params }),
          axiosClient.get(ep.INTERVIEW_ANALYSIS, { params }),
          axiosClient.get(ep.UNPLACED_STUDENTS, { params }),
        ]
      : [];

    const settled = await Promise.allSettled([
      ...coreRequests,
      ...extendedRequests,
    ]);

    let failures = 0;

    // 0: overview
    if (settled[0]?.status === 'fulfilled' && settled[0].value?.data) {
      setOverview({ ...INITIAL_OVERVIEW, ...settled[0].value.data });
    } else {
      failures += 1;
      setOverview(INITIAL_OVERVIEW);
    }

    // 1: placement-trends
    if (settled[1]?.status === 'fulfilled') {
      setPlacementTrends(extractList(settled[1].value?.data));
    } else {
      failures += 1;
      setPlacementTrends([]);
    }

    // 2: department-wise
    if (settled[2]?.status === 'fulfilled') {
      setDepartmentWise(extractList(settled[2].value?.data));
    } else {
      failures += 1;
      setDepartmentWise([]);
    }

    // 3: company-wise
    if (settled[3]?.status === 'fulfilled') {
      setCompanyWise(extractList(settled[3].value?.data));
    } else {
      failures += 1;
      setCompanyWise([]);
    }

    // 4: package-analysis
    if (settled[4]?.status === 'fulfilled' && settled[4].value?.data) {
      const p = settled[4].value.data;
      setPackageAnalysis({
        average_package: p.average_package ?? 0,
        highest_package: p.highest_package ?? 0,
        lowest_package: p.lowest_package ?? 0,
        package_distribution: Array.isArray(p.package_distribution)
          ? p.package_distribution
          : [],
      });
    } else {
      failures += 1;
      setPackageAnalysis(INITIAL_PACKAGES);
    }

    if (includeExtended) {
      // 5: application-trends
      if (settled[5]?.status === 'fulfilled') {
        setApplicationTrends(extractList(settled[5].value?.data));
      } else {
        failures += 1;
        setApplicationTrends([]);
      }

      // 6: application-status
      if (
        settled[6]?.status === 'fulfilled' &&
        settled[6].value?.data &&
        typeof settled[6].value.data === 'object'
      ) {
        setApplicationStatus(settled[6].value.data);
      } else {
        failures += 1;
        setApplicationStatus({});
      }

      // 7: drive-performance
      if (settled[7]?.status === 'fulfilled') {
        setDrivePerformance(extractList(settled[7].value?.data));
      } else {
        failures += 1;
        setDrivePerformance([]);
      }

      // 8: interview-analysis
      if (settled[8]?.status === 'fulfilled' && settled[8].value?.data) {
        setInterviewAnalysis({
          ...INITIAL_INTERVIEW_ANALYSIS,
          ...settled[8].value.data,
        });
      } else {
        failures += 1;
        setInterviewAnalysis(INITIAL_INTERVIEW_ANALYSIS);
      }

      // 9: unplaced-students
      if (settled[9]?.status === 'fulfilled') {
        setUnplacedStudents(extractList(settled[9].value?.data));
      } else {
        failures += 1;
        setUnplacedStudents([]);
      }
    }

    setFailedEndpointsCount(failures);
    setIsLoading(false);
  }, [filters, includeExtended]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    overview,
    placementTrends,
    applicationTrends,
    applicationStatus,
    departmentWise,
    companyWise,
    packageAnalysis,
    drivePerformance,
    interviewAnalysis,
    unplacedStudents,
    isLoading,
    failedEndpointsCount,
    refresh: fetchAll,
  };
}