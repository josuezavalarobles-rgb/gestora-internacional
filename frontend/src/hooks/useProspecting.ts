import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prospectingApi } from '@/services/api';
import type {
  FindEmailData,
  SearchPeopleData,
  SearchOrganizationsData,
  LinkedInSearchData,
  SmartEnrichData,
} from '@/types';

// Query key constants
export const PROSPECTING_KEYS = {
  status: ['prospecting', 'status'] as const,
  hunterAccount: ['prospecting', 'hunter', 'account'] as const,
  apolloAccount: ['prospecting', 'apollo', 'account'] as const,
  phantomBusterAccount: ['prospecting', 'phantombuster', 'account'] as const,
  phantomBusterAgents: ['prospecting', 'phantombuster', 'agents'] as const,
  phantomBusterContainer: (containerId: string) => ['prospecting', 'phantombuster', 'container', containerId] as const,
};

// ============ STATUS & CONFIGURATION ============

export function useProspectingStatus() {
  return useQuery({
    queryKey: PROSPECTING_KEYS.status,
    queryFn: prospectingApi.getStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useConfigureProspecting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, apiKey, isActive }: { provider: 'HUNTER' | 'APOLLO' | 'PHANTOMBUSTER'; apiKey: string; isActive?: boolean }) =>
      prospectingApi.configure(provider, apiKey, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROSPECTING_KEYS.status });
    },
  });
}

// ============ HUNTER.IO HOOKS ============

export function useHunterFindEmail() {
  return useMutation({
    mutationFn: (data: FindEmailData) => prospectingApi.hunterFindEmail(data),
  });
}

export function useHunterSearchDomain() {
  return useMutation({
    mutationFn: ({ domain, type, limit }: { domain: string; type?: 'personal' | 'generic'; limit?: number }) =>
      prospectingApi.hunterSearchDomain(domain, type, limit),
  });
}

export function useHunterVerifyEmail() {
  return useMutation({
    mutationFn: (email: string) => prospectingApi.hunterVerifyEmail(email),
  });
}

export function useHunterVerifyBatch() {
  return useMutation({
    mutationFn: (emails: string[]) => prospectingApi.hunterVerifyBatch(emails),
  });
}

export function useHunterEnrichLead() {
  return useMutation({
    mutationFn: ({ companyDomain, firstName, lastName }: { companyDomain: string; firstName?: string; lastName?: string }) =>
      prospectingApi.hunterEnrichLead(companyDomain, firstName, lastName),
  });
}

export function useHunterAccount() {
  return useQuery({
    queryKey: PROSPECTING_KEYS.hunterAccount,
    queryFn: prospectingApi.hunterGetAccount,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============ APOLLO.IO HOOKS ============

export function useApolloSearchPeople() {
  return useMutation({
    mutationFn: (data: SearchPeopleData) => prospectingApi.apolloSearchPeople(data),
  });
}

export function useApolloSearchOrganizations() {
  return useMutation({
    mutationFn: (data: SearchOrganizationsData) => prospectingApi.apolloSearchOrganizations(data),
  });
}

export function useApolloEnrichPerson() {
  return useMutation({
    mutationFn: ({ firstName, lastName, organizationDomain, email, linkedinUrl }: {
      firstName?: string;
      lastName?: string;
      organizationDomain?: string;
      email?: string;
      linkedinUrl?: string;
    }) => prospectingApi.apolloEnrichPerson(firstName, lastName, organizationDomain, email, linkedinUrl),
  });
}

export function useApolloEnrichOrganization() {
  return useMutation({
    mutationFn: (domain: string) => prospectingApi.apolloEnrichOrganization(domain),
  });
}

export function useApolloGetCompanyContacts() {
  return useMutation({
    mutationFn: ({ companyDomain, titles, limit }: { companyDomain: string; titles?: string[]; limit?: number }) =>
      prospectingApi.apolloGetCompanyContacts(companyDomain, titles, limit),
  });
}

export function useApolloFindDecisionMakers() {
  return useMutation({
    mutationFn: ({ industry, location, companySize, titles, limit }: {
      industry: string;
      location?: string;
      companySize?: string;
      titles?: string[];
      limit?: number;
    }) => prospectingApi.apolloFindDecisionMakers(industry, location, companySize, titles, limit),
  });
}

export function useApolloAccount() {
  return useQuery({
    queryKey: PROSPECTING_KEYS.apolloAccount,
    queryFn: prospectingApi.apolloGetAccount,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============ PHANTOMBUSTER HOOKS ============

export function usePhantomBusterAgents() {
  return useQuery({
    queryKey: PROSPECTING_KEYS.phantomBusterAgents,
    queryFn: prospectingApi.phantomBusterListAgents,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function usePhantomBusterLaunchAgent() {
  return useMutation({
    mutationFn: ({ agentId, argument, saveToCloud }: { agentId: string; argument?: any; saveToCloud?: boolean }) =>
      prospectingApi.phantomBusterLaunchAgent(agentId, argument, saveToCloud),
  });
}

export function usePhantomBusterContainerStatus(containerId: string) {
  return useQuery({
    queryKey: PROSPECTING_KEYS.phantomBusterContainer(containerId),
    queryFn: () => prospectingApi.phantomBusterGetContainerStatus(containerId),
    enabled: !!containerId,
    refetchInterval: (query) => {
      // Auto-refresh every 5 seconds if still running
      const data = query.state.data as any;
      if (data?.status === 'running' || data?.status === 'queued') {
        return 5000;
      }
      return false;
    },
  });
}

export function usePhantomBusterExtractLinkedInProfiles() {
  return useMutation({
    mutationFn: ({ searchUrl, numberOfPages, emailDiscovery }: {
      searchUrl: string;
      numberOfPages?: number;
      emailDiscovery?: boolean;
    }) => prospectingApi.phantomBusterExtractLinkedInProfiles(searchUrl, numberOfPages, emailDiscovery),
  });
}

export function usePhantomBusterSearchLinkedIn() {
  return useMutation({
    mutationFn: (data: LinkedInSearchData) => prospectingApi.phantomBusterSearchLinkedIn(data),
  });
}

export function usePhantomBusterExtractLinkedInCompany() {
  return useMutation({
    mutationFn: ({ companyUrl, extractEmployees }: { companyUrl: string; extractEmployees?: boolean }) =>
      prospectingApi.phantomBusterExtractLinkedInCompany(companyUrl, extractEmployees),
  });
}

export function usePhantomBusterSendLinkedInMessages() {
  return useMutation({
    mutationFn: ({ profileUrls, message, useProfileTag }: {
      profileUrls: string[];
      message: string;
      useProfileTag?: boolean;
    }) => prospectingApi.phantomBusterSendLinkedInMessages(profileUrls, message, useProfileTag),
  });
}

export function usePhantomBusterSendConnectionRequests() {
  return useMutation({
    mutationFn: ({ profileUrls, personalizedMessage, maxRequestsPerDay }: {
      profileUrls: string[];
      personalizedMessage?: string;
      maxRequestsPerDay?: number;
    }) => prospectingApi.phantomBusterSendConnectionRequests(profileUrls, personalizedMessage, maxRequestsPerDay),
  });
}

export function usePhantomBusterExtractInstagramFollowers() {
  return useMutation({
    mutationFn: ({ username, maxFollowers }: { username: string; maxFollowers?: number }) =>
      prospectingApi.phantomBusterExtractInstagramFollowers(username, maxFollowers),
  });
}

export function usePhantomBusterExtractFacebookPosts() {
  return useMutation({
    mutationFn: ({ pageUrl, maxPosts }: { pageUrl: string; maxPosts?: number }) =>
      prospectingApi.phantomBusterExtractFacebookPosts(pageUrl, maxPosts),
  });
}

export function usePhantomBusterScrapeWebsite() {
  return useMutation({
    mutationFn: ({ url, selectors, waitTime }: { url: string; selectors?: { [key: string]: string }; waitTime?: number }) =>
      prospectingApi.phantomBusterScrapeWebsite(url, selectors, waitTime),
  });
}

export function usePhantomBusterAccount() {
  return useQuery({
    queryKey: PROSPECTING_KEYS.phantomBusterAccount,
    queryFn: prospectingApi.phantomBusterGetAccount,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// ============ COMBINED/SMART HOOKS ============

export function useSmartEnrich() {
  return useMutation({
    mutationFn: (data: SmartEnrichData) => prospectingApi.smartEnrich(data),
  });
}
