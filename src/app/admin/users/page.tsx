'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'
import type { User, UserRole, AccountStatus, Gender, Project, UserProject } from '@/types'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'
type FilterRole = 'all' | UserRole
type FilterGender = 'all' | Gender
type FilterBanned = 'all' | 'banned' | 'active'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterRole, setFilterRole] = useState<FilterRole>('all')
  const [filterGender, setFilterGender] = useState<FilterGender>('all')
  const [filterBanned, setFilterBanned] = useState<FilterBanned>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    gender: '' as Gender | ''
  })
  const [formLimit, setFormLimit] = useState('')
  const [submissionLimit, setSubmissionLimit] = useState('')

  // Pagination state
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  // Stats state (separate from paginated data)
  const [stats, setStats] = useState({ total: 0, pending: 0, supervisors: 0, admins: 0 })

  // Projects modal state
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [userProjects, setUserProjects] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData(0)
  }, [])

  useEffect(() => {
    setPage(0)
  }, [search, filterStatus, filterRole, filterGender, filterBanned])

  useEffect(() => {
    fetchData(page)
  }, [page])

  const buildQuery = (selectStr: string, forCount: boolean) => {
    let query = supabase.from('profiles').select(selectStr, forCount ? { count: 'exact', head: true } : undefined)

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }
    if (filterRole !== 'all') {
      query = query.eq('role', filterRole)
    }
    if (filterGender !== 'all') {
      query = query.eq('gender', filterGender)
    }
    if (filterBanned !== 'all') {
      query = query.eq('banned', filterBanned === 'banned')
    }

    return query
  }

  const fetchData = async (currentPage: number) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setCurrentUser(profile)

      // Get total count with filters
      const countQuery = buildQuery('*', true)
      const { count } = await countQuery
      const total = count || 0
      setTotalCount(total)

      // Fetch current page with range
      const from = currentPage * pageSize
      const to = Math.min(from + pageSize - 1, total - 1)
      if (from <= to && total > 0) {
        let dataQuery = buildQuery('*', false)
        dataQuery = dataQuery.order('created_at', { ascending: false }).range(from, to)
        const { data: usersData, error } = await dataQuery
        if (error) throw error
        setUsers(usersData || [])
      } else {
        setUsers([])
      }

      // Fetch stats (unfiltered counts)
      const [{ count: totalAll }, { count: pendingCount }, { count: supervisorCount }, { count: adminCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
      ])
      setStats({
        total: totalAll || 0,
        pending: pendingCount || 0,
        supervisors: supervisorCount || 0,
        admins: adminCount || 0
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast('حدث خطأ أثناء تحميل البيانات', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    userId: string, 
    action: 'approve' | 'reject' | 'role' | 'delete' | 'reset_password' | 'edit' | 'ban' | 'unban' | 'limits', 
    newRole?: UserRole, 
    updatedData?: Partial<User>
  ) => {
    setActionLoading(true)
    try {
      if (action === 'delete') {
        const confirmed = confirm('هل أنت متأكد من حذف هذا المستخدم؟')
        if (!confirmed) {
          setActionLoading(false)
          return
        }
        
        const res = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        
        fetchData(page)
        setShowModal(false)
        setSelectedUser(null)
        setActionLoading(false)
        return
      }
      
      if (action === 'reset_password') {
        const res = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, password: '123456' })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        
        toast('تم إعادة تعيين الباسورد بنجاح. الباسورد الجديد: 123456', 'success')
        setActionLoading(false)
        return
      }

      if (action === 'ban' || action === 'unban') {
        const { error } = await supabase
          .from('profiles')
          .update({ banned: action === 'ban' })
          .eq('id', userId)
        if (error) throw error
        fetchData(page)
        setSelectedUser(prev => prev ? { ...prev, banned: action === 'ban' } : null)
        setActionLoading(false)
        return
      }

      if (action === 'limits') {
        const updateFields: Record<string, any> = {}
        if (formLimit !== '') updateFields.form_limit = formLimit === '-1' ? -1 : parseInt(formLimit)
        if (submissionLimit !== '') updateFields.submission_limit = submissionLimit === '-1' ? -1 : parseInt(submissionLimit)
        const { error } = await supabase.from('profiles').update(updateFields).eq('id', userId)
        if (error) throw error
        fetchData(page)
        setSelectedUser(prev => prev ? { ...prev, ...updateFields } : null)
        setActionLoading(false)
        return
      }

      const updateData: Partial<User> = {}

      if (action === 'approve') {
        updateData.status = 'approved'
      } else if (action === 'reject') {
        updateData.status = 'rejected'
      } else if (action === 'role' && newRole) {
        updateData.role = newRole
      } else if (action === 'edit' && updatedData) {
        Object.assign(updateData, updatedData)
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Refresh users list on current page
      fetchData(page)
      setShowModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      toast('حدث خطأ أثناء تحديث المستخدم')
    } finally {
      setActionLoading(false)
    }
  }

  const openProjectsModal = async (user: User) => {
    setSelectedUser(user)
    setShowProjectsModal(true)
    setProjectsLoading(true)
    try {
      setAllProjects([])
      setUserProjects([])
      setSelectedProjects([])
    } catch (error) {
      console.error('Error loading projects:', error)
      toast('حدث خطأ أثناء تحميل المشاريع')
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSaveProjects = async () => {
    if (!selectedUser) return
    setProjectsLoading(true)
    try {
      const newlyAssigned = selectedProjects.filter(id => !userProjects.includes(id))

      // Delete all existing assignments for this user
      const { error: deleteError } = await supabase
        .from('user_projects')
        .delete()
        .eq('user_id', selectedUser.id)

      if (deleteError) throw deleteError

      // Insert selected assignments
      if (selectedProjects.length > 0) {
        const inserts = selectedProjects.map(projectId => ({
          user_id: selectedUser.id,
          project_id: projectId
        }))

        const { error: insertError } = await supabase
          .from('user_projects')
          .insert(inserts)

        if (insertError) throw insertError
      }

      // Create notifications for newly assigned projects (check preferences)
      if (newlyAssigned.length > 0) {
        // Check if user has disabled assignment notifications
        const { data: pref } = await supabase
          .from('notification_preferences')
          .select('enabled')
          .eq('user_id', selectedUser.id)
          .eq('notification_type', 'assignment')
          .maybeSingle()

        const shouldNotify = pref ? pref.enabled : true

        if (shouldNotify) {
          const projectNames = allProjects
            .filter(p => newlyAssigned.includes(p.id))
            .reduce((acc, p) => { acc[p.id] = p.name; return acc }, {} as Record<string, string>)

          const notifications = newlyAssigned.map(projectId => ({
            user_id: selectedUser.id,
            title: `تم إضافتك إلى مشروع ${projectNames[projectId] || ''}`,
            type: 'assignment',
            link: `/projects/${projectId}`
          }))

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications)

          if (notifError) console.error('Error creating notifications:', notifError)
        }
      }

      setUserProjects([...selectedProjects])
      setShowProjectsModal(false)
    } catch (error) {
      console.error('Error saving projects:', error)
      toast('حدث خطأ أثناء حفظ المشاريع')
    } finally {
      setProjectsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage)
    }
  }

  const handleFilterReset = () => {
    setPage(0)
    // Filter state changes are handled by the useEffect
  }

  const getStatusBadge = (status: AccountStatus) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    const labels = {
      pending: 'معلق',
      approved: 'موافق عليه',
      rejected: 'مرفوض'
    }
    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getRoleBadge = (role: UserRole) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-700',
      supervisor: 'bg-blue-100 text-blue-700',
      volunteer: 'bg-gray-100 text-gray-700'
    }
    const labels = {
      admin: 'مدير',
      supervisor: 'مشرف',
      volunteer: 'متطوع'
    }
    return (
      <span className={`px-3 py-1 text-xs rounded-full font-medium ${badges[role]}`}>
        {labels[role]}
      </span>
    )
  }

  const getGenderBadge = (gender: Gender) => {
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${
        gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
      }`}>
        {gender === 'male' ? 'ذكر' : 'أنثى'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              رجوع
            </button>
            <h1 className="text-lg font-bold text-blue-700">إدارة المستخدمين</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {totalCount} مستخدم
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">إجمالي المستخدمين</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">طلبات معلقة</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">المشرفون</p>
            <p className="text-2xl font-bold text-blue-600">{stats.supervisors}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">الادارة</p>
            <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">معلق</option>
              <option value="approved">موافق عليه</option>
              <option value="rejected">مرفوض</option>
            </select>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الأدوار</option>
              <option value="admin">مدير</option>
              <option value="supervisor">مشرف</option>
              <option value="volunteer">متطوع</option>
            </select>

            {/* Gender Filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value as FilterGender)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">كل الأنواع</option>
              <option value="male">ذكور</option>
              <option value="female">إناث</option>
            </select>

            {/* Banned Filter */}
            <select
              value={filterBanned}
              onChange={(e) => setFilterBanned(e.target.value as FilterBanned)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">الجميع</option>
              <option value="active">نشط</option>
              <option value="banned">محظور</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">البريد الإلكتروني</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الشريك</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                 </tr>
              </thead>
               <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                   <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                           {user.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-medium text-gray-900">{user.name}</p>
                           {user.phone && (
                             <p className="text-sm text-gray-500">{user.phone}</p>
                           )}
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-gray-600">{user.email}</td>
                     <td className="px-6 py-4">{getGenderBadge(user.gender)}</td>
                     <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                     <td className="px-6 py-4">
                       {getStatusBadge(user.status)}
                       {user.banned && (
                         <span className="px-2 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700 mr-1">
                           محظور
                         </span>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       {user.is_partner ? (
                         <span className="px-2 py-1 text-xs rounded-full font-medium bg-indigo-100 text-indigo-800">
                           شريك
                         </span>
                       ) : (
                         <span className="px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-500">
                           عادي
                         </span>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         {user.status === 'pending' && (
                           <>
                             <button
                               onClick={() => handleAction(user.id, 'approve')}
                               disabled={actionLoading}
                               className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                             >
                               قبول
                             </button>
                             <button
                               onClick={() => handleAction(user.id, 'reject')}
                               disabled={actionLoading}
                               className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                             >
                               رفض
                             </button>
                           </>
                         )}
                         <button
                           onClick={() => {
                             setSelectedUser(user)
                             setShowModal(true)
                             setFormLimit('')
                             setSubmissionLimit('')
                           }}
                           className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                         >
                           إدارة
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">لا توجد مستخدمين</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 mt-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              الصفحة {page + 1} من {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </main>

      {/* User Action Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowModal(false)
              setSelectedUser(null)
              setEditingUser(false)
              setFormLimit('')
              setSubmissionLimit('')
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingUser ? 'تعديل بيانات المستخدم' : 'إدارة المستخدم'}
            </h3>
            
            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* Edit Form */}
            {editingUser ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value as Gender }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر...</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleAction(selectedUser.id, 'edit', undefined, {
                        name: editFormData.name,
                        phone: editFormData.phone || undefined,
                        gender: editFormData.gender as Gender
                      })
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button
                    onClick={() => setEditingUser(false)}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {/* Edit User Data */}
                  <button
                    onClick={() => {
                      setEditFormData({
                        name: selectedUser.name,
                        phone: selectedUser.phone || '',
                        gender: selectedUser.gender
                      })
                      setEditingUser(true)
                    }}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    تعديل البيانات
                  </button>

                  {/* Manage Projects */}
                  <button
                    onClick={() => openProjectsModal(selectedUser)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    المشاريع
                  </button>

                  {/* Ban / Unban */}
                  <button
                    onClick={() => handleAction(selectedUser.id, selectedUser.banned ? 'unban' : 'ban')}
                    disabled={actionLoading}
                    className={`w-full py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                      selectedUser.banned
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {selectedUser.banned ? 'إلغاء الحظر' : 'حظر المستخدم'}
                  </button>

                  {/* Reset Password */}
                  <button
                    onClick={() => handleAction(selectedUser.id, 'reset_password')}
                    disabled={actionLoading}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    إعادة تعيين الباسورد (123456)
                  </button>

                  {/* Role Change */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تغيير الدور</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAction(selectedUser.id, 'role', 'volunteer')}
                        disabled={actionLoading || selectedUser.role === 'volunteer'}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedUser.role === 'volunteer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        متطوع
                      </button>
                      <button
                        onClick={() => handleAction(selectedUser.id, 'role', 'supervisor')}
                        disabled={actionLoading || selectedUser.role === 'supervisor'}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedUser.role === 'supervisor'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        مشرف
                      </button>
                      <button
                        onClick={() => handleAction(selectedUser.id, 'role', 'admin')}
                        disabled={actionLoading || selectedUser.role === 'admin'}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          selectedUser.role === 'admin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        مدير
                      </button>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">الحدود</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">حد الفورمز</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={formLimit}
                            onChange={(e) => setFormLimit(e.target.value)}
                            placeholder={selectedUser.form_limit === -1 ? 'غير محدود' : String(selectedUser.form_limit ?? -1)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            min="-1"
                          />
                          <button
                            onClick={() => handleAction(selectedUser.id, 'limits')}
                            disabled={actionLoading}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            حفظ
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">-1 غير محدود</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">حد الردود</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={submissionLimit}
                            onChange={(e) => setSubmissionLimit(e.target.value)}
                            placeholder={selectedUser.submission_limit === -1 ? 'غير محدود' : String(selectedUser.submission_limit ?? -1)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            min="-1"
                          />
                          <button
                            onClick={() => handleAction(selectedUser.id, 'limits')}
                            disabled={actionLoading}
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            حفظ
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">-1 غير محدود</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Change */}
                  {selectedUser.status !== 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">تغيير الحالة</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction(selectedUser.id, 'approve')}
                          disabled={actionLoading || selectedUser.status === 'approved'}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedUser.status === 'approved'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          تفعيل
                        </button>
                        <button
                          onClick={() => handleAction(selectedUser.id, 'reject')}
                          disabled={actionLoading || selectedUser.status === 'rejected'}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedUser.status === 'rejected'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          تعطيل
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete User */}
                  <button
                    onClick={() => handleAction(selectedUser.id, 'delete')}
                    disabled={actionLoading || selectedUser.id === currentUser?.id}
                    className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    title={selectedUser.id === currentUser?.id ? 'لا يمكنك حذف حسابك الحالي' : 'حذف المستخدم'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف المستخدم
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedUser(null)
                    setFormLimit('')
                    setSubmissionLimit('')
                  }}
                  className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إغلاق
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Projects Sub-Modal */}
      {showProjectsModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!projectsLoading) {
                setShowProjectsModal(false)
              }
            }}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              إدارة مشاريع المستخدم
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {selectedUser.name} : اختر المشاريع التي يمكن لهذا المستخدم الوصول إليها
            </p>

            {projectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-80 overflow-y-auto">
                  {allProjects.map(project => {
                    const isChecked = selectedProjects.includes(project.id)
                    return (
                      <label
                        key={project.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                          style={{ backgroundColor: project.color || '#12D8D8' }}
                        >
                          {project.icon ? (
                            <span className="text-lg">{project.icon}</span>
                          ) : (
                            <span className="text-sm">{project.name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-gray-500 truncate">{project.description}</p>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleProjectToggle(project.id)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 shrink-0"
                        />
                      </label>
                    )
                  })}
                  {allProjects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      لا توجد مشاريع متاحة
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveProjects}
                    disabled={projectsLoading}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {projectsLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ'
                    )}
                  </button>
                  <button
                    onClick={() => setShowProjectsModal(false)}
                    disabled={projectsLoading}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
