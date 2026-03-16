'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'
import {
  BusinessPlanData,
  FormTemplateType,
  createEmptyBusinessPlan,
} from '../types/business-plan'

// Fetch all business plans for current user
export function useBusinessPlans() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['business-plans', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })
}

// Fetch single business plan
export function useBusinessPlan(id: string | undefined) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['business-plan', id],
    queryFn: async () => {
      if (!id || !user?.id) return null

      const { data, error } = await supabase
        .from('business_plans')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // Convert database format to BusinessPlanData
      return convertDbToBusinessPlan(data)
    },
    enabled: !!id && !!user?.id,
  })
}

// Create new business plan
export function useCreateBusinessPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      templateType,
      title,
    }: {
      templateType: FormTemplateType
      title?: string
    }) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('business_plans')
        .insert({
          user_id: user.id,
          template_type: templateType,
          title: title || `새 사업계획서`,
          status: 'draft',
          basic_info: {},
          problem_data: {},
          solution_data: {},
          scaleup_data: {},
          team_data: {},
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-plans'] })
    },
  })
}

// Update business plan
export function useUpdateBusinessPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      data,
      sectionData,
    }: {
      id: string
      data?: Partial<BusinessPlanData>
      sectionData?: Record<string, Record<string, string>>
    }) => {
      if (!user?.id) throw new Error('Not authenticated')

      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (data?.status) {
        updatePayload.status = data.status
      }

      if (data?.basicInfo) {
        updatePayload.basic_info = data.basicInfo
        updatePayload.title = data.basicInfo.itemName || '새 사업계획서'
      }

      if (sectionData) {
        if (sectionData.problem) {
          updatePayload.problem_data = sectionData.problem
        }
        if (sectionData.solution) {
          updatePayload.solution_data = sectionData.solution
        }
        if (sectionData.scaleup) {
          updatePayload.scaleup_data = sectionData.scaleup
        }
        if (sectionData.team) {
          updatePayload.team_data = sectionData.team
        }
        // Extra sections
        const extraSectionTypes = ['business_canvas', 'cooperation', 'traditional_culture', 'social_value', 'regional_connection', 'organization_capacity']
        const extraSections: Record<string, Record<string, string>> = {}
        for (const type of extraSectionTypes) {
          if (sectionData[type]) {
            extraSections[type] = sectionData[type]
          }
        }
        if (Object.keys(extraSections).length > 0) {
          updatePayload.extra_sections = extraSections
        }
      }

      const { data: updated, error } = await supabase
        .from('business_plans')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return updated
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-plans'] })
      queryClient.invalidateQueries({ queryKey: ['business-plan', variables.id] })
    },
  })
}

// Update validation score
export function useUpdateValidationScore() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      score,
    }: {
      id: string
      score: number
    }) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('business_plans')
        .update({
          validation_score: score,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-plan', variables.id] })
    },
  })
}

// Delete business plan
export function useDeleteBusinessPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('business_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-plans'] })
    },
  })
}

// Helper function to convert database format to BusinessPlanData
function convertDbToBusinessPlan(dbData: {
  id: string
  template_type: FormTemplateType
  status: 'draft' | 'in_progress' | 'completed'
  title: string | null
  basic_info: Record<string, unknown> | null
  problem_data: Record<string, unknown> | null
  solution_data: Record<string, unknown> | null
  scaleup_data: Record<string, unknown> | null
  team_data: Record<string, unknown> | null
  extra_sections: Record<string, unknown> | null
  validation_score: number | null
  created_at: string | null
  updated_at: string | null
}): BusinessPlanData {
  const emptyPlan = createEmptyBusinessPlan(dbData.template_type)

  return {
    id: dbData.id,
    templateType: dbData.template_type,
    status: dbData.status,
    basicInfo: {
      ...emptyPlan.basicInfo,
      ...(dbData.basic_info as Partial<BusinessPlanData['basicInfo']>),
    },
    problem: {
      ...emptyPlan.problem,
      ...(dbData.problem_data as Partial<BusinessPlanData['problem']>),
    },
    solution: {
      ...emptyPlan.solution,
      ...(dbData.solution_data as Partial<BusinessPlanData['solution']>),
    },
    scaleup: {
      ...emptyPlan.scaleup,
      ...(dbData.scaleup_data as Partial<BusinessPlanData['scaleup']>),
    },
    team: {
      ...emptyPlan.team,
      ...(dbData.team_data as Partial<BusinessPlanData['team']>),
    },
    extraSections: dbData.extra_sections as Record<string, unknown> | undefined,
    createdAt: dbData.created_at || undefined,
    updatedAt: dbData.updated_at || undefined,
  }
}
