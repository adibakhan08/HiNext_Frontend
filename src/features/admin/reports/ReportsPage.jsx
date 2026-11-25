import { FileSpreadsheet } from 'lucide-react';
import { FeatureComingSoon } from '../../../components/ui/FeatureComingSoon';

export function ReportsPage() {
  return (
    <FeatureComingSoon
      title="Reports"
      subtitle="Exportable placement summaries, student rosters, and audit logs"
      badgeText="Under Development"
      eta="Releasing Soon"
      icon={FileSpreadsheet}
      headline="Automated Placement Reports & Exports"
      description="Soon you will be able to generate one-click CSV, Excel, and PDF reports for NAAC/NIRF audits, drive-wise shortlists, and final student offer summaries."
      highlights={[
        'Drive-wise registered & shortlisted student exports (CSV/XLSX)',
        'Final placed candidates & offer letter register',
        'Unplaced eligible student tracking sheets',
        'Custom academic session & department report builder',
      ]}
    />
  );
}