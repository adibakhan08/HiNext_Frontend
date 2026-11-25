import { useEffect, useState } from 'react';
import { X, Building2, CheckCircle2, Upload } from 'lucide-react';
import { axiosClient } from '../../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../../api/endpoints';

const INITIAL_FORM = {
  name: '',
  website: '',
  description: '',
  industry_sector: 'Information Technology',
  company_size: '10000+',
  headquarters: '',
  address: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
};

const INDUSTRY_SECTORS = [
  'Information Technology',
  'Product & Software',
  'Finance & FinTech',
  'Consulting',
  'E-Commerce',
  'Core Engineering',
  'Healthcare & Biotech',
  'Other',
];

const COMPANY_SIZES = [
  '1-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];

export function CompanyFormModal({ isOpen, onClose, company, onSaved }) {
  const isEditing = Boolean(company?.id);
  const [form, setForm] = useState(INITIAL_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        website: company.website || '',
        description: company.description || '',
        industry_sector: company.industry_sector || 'Information Technology',
        company_size: company.company_size || '10000+',
        headquarters: company.headquarters || '',
        address: company.address || '',
        email: company.email || '',
        phone: company.phone || '',
        status: company.status || 'ACTIVE',
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setLogoFile(null);
    setError(null);
    setSuccessMsg(null);
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFillSample = () => {
    setForm({
      name: 'Tata Consultancy Services',
      website: 'https://www.tcs.com',
      description: 'Global IT services, consulting and business solutions company.',
      industry_sector: 'Information Technology',
      company_size: '10000+',
      headquarters: 'Mumbai, Maharashtra',
      address: 'TCS House, Raveline Street, Mumbai',
      email: 'careers@tcs.com',
      phone: '9876543210',
      status: 'ACTIVE',
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    // Build FormData so Django MultiPartParser / FormParser accepts the request
    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('website', form.website.trim());
    formData.append('description', form.description.trim());
    formData.append('industry_sector', form.industry_sector);
    formData.append('company_size', form.company_size);
    formData.append('headquarters', form.headquarters.trim());
    formData.append('address', form.address.trim());
    formData.append('email', form.email.trim());
    formData.append('phone', form.phone.trim());
    formData.append('status', form.status);

    if (logoFile) {
      formData.append('logo', logoFile);
    }

    const requestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    try {
      const { data } = isEditing
        ? await axiosClient.patch(
            API_ENDPOINTS.ADMIN.COMPANY_DETAIL(company.id),
            formData,
            requestConfig
          )
        : await axiosClient.post(
            API_ENDPOINTS.ADMIN.COMPANIES,
            formData,
            requestConfig
          );

      setSuccessMsg(
        isEditing ? 'Company updated successfully.' : 'Company created successfully.'
      );
      onSaved?.(data);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    } catch (err) {
      const resData = err.response?.data;
      if (typeof resData === 'string') {
        setError(resData);
      } else if (resData && typeof resData === 'object') {
        const firstKey = Object.keys(resData)[0];
        const firstVal = Array.isArray(resData[firstKey])
          ? resData[firstKey][0]
          : resData[firstKey];
        setError(
          resData.detail ||
            resData.message ||
            `${firstKey}: ${firstVal}` ||
            'Failed to save company.'
        );
      } else {
        setError('Network error while saving company.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/15 text-accent-amber">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary">
                {isEditing ? 'Edit Company' : 'Create Company'}
              </h2>
              <p className="text-xs text-ink-muted">
                {isEditing
                  ? `Updating ${company.name}`
                  : 'Register a recruiting organization via /api/companies/'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sample Payload Quick Fill */}
        {!isEditing && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-brand-500/20 bg-brand-900/20 px-3.5 py-2.5 text-xs">
            <span className="text-ink-secondary">
              Fill sample data (<span className="text-brand-400">Tata Consultancy Services</span>)
            </span>
            <button
              type="button"
              onClick={handleFillSample}
              className="font-medium text-brand-400 hover:underline cursor-pointer"
            >
              Fill sample
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Row 1: Name & Website */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs font-medium text-ink-secondary">
                Company name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Tata Consultancy Services"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className="block text-xs font-medium text-ink-secondary">
                Website
              </label>
              <input
                id="website"
                name="website"
                type="url"
                required
                placeholder="https://www.tcs.com"
                value={form.website}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 2: Industry Sector, Company Size & Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="industry_sector"
                className="block text-xs font-medium text-ink-secondary"
              >
                Industry sector
              </label>
              <select
                id="industry_sector"
                name="industry_sector"
                value={form.industry_sector}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {INDUSTRY_SECTORS.map((sec) => (
                  <option key={sec} value={sec} className="bg-surface-card text-ink-primary">
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="company_size"
                className="block text-xs font-medium text-ink-secondary"
              >
                Company size
              </label>
              <select
                id="company_size"
                name="company_size"
                value={form.company_size}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size} className="bg-surface-card text-ink-primary">
                    {size} employees
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status" className="block text-xs font-medium text-ink-secondary">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-ink-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st} className="bg-surface-card text-ink-primary">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Email & Phone */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-ink-secondary">
                Careers / HR email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="careers@tcs.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-medium text-ink-secondary">
                Contact phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="9876543210"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 4: Headquarters & Address */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="headquarters"
                className="block text-xs font-medium text-ink-secondary"
              >
                Headquarters
              </label>
              <input
                id="headquarters"
                name="headquarters"
                type="text"
                required
                placeholder="Mumbai, Maharashtra"
                value={form.headquarters}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-xs font-medium text-ink-secondary">
                Office address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                placeholder="TCS House, Raveline Street, Mumbai"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Row 5: Optional Logo Upload */}
          <div className="space-y-1.5">
            <label htmlFor="logo" className="block text-xs font-medium text-ink-secondary">
              Company logo (Optional)
            </label>
            <label
              htmlFor="logo"
              className="flex items-center justify-between rounded-lg border border-dashed border-border-subtle bg-surface-input/60 px-3.5 py-2.5 text-xs text-ink-secondary transition hover:border-brand-500/40 cursor-pointer"
            >
              <span className="truncate">
                {logoFile ? logoFile.name : 'Choose PNG, JPG, or SVG logo...'}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-brand-400">
                <Upload className="h-3.5 w-3.5" />
                Browse
              </span>
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {/* Row 6: Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-xs font-medium text-ink-secondary"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              placeholder="Global IT services, consulting and business solutions company."
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-border-subtle bg-surface-input px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border-subtle bg-surface-input px-4 py-2 text-xs font-medium text-ink-secondary transition hover:bg-surface-elevated hover:text-ink-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-60 cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Company'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}