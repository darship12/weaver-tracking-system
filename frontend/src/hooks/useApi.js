import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export function useApiQuery(key, fn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const res = await fn()
      return res.data
    },
    ...options,
  })
}

export function useApiMutation(fn, options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      if (options.successMessage) toast.success(options.successMessage)
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }))
      }
      options.onSuccess?.(data)
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || error.response?.data?.message || 'An error occurred'
      toast.error(msg)
      options.onError?.(error)
    },
  })
}
