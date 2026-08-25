import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api } from '../services/api'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid college email is required'),
  student_id: z.string().min(3, 'Student ID is required'),
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(8, 'Password should be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values) => {
    const { confirmPassword: _confirmPassword, ...payload } = values
    try {
      const response = await api.auth.register(payload)
      localStorage.setItem('current_user', JSON.stringify(response.data.user))
      toast.success(response.message || 'Registration successful.')
    } catch (error) {
      toast.error(error.message || 'Registration failed.')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card wide">
        <p className="eyebrow accent">Create account</p>
        <h2>Register for campus access</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form two-col">
          <label>
            <span>Full name</span>
            <input type="text" {...register('name')} placeholder="Amit Singh" />
            {errors.name && <small>{errors.name.message}</small>}
          </label>

          <label>
            <span>College email</span>
            <input type="email" {...register('email')} placeholder="name@campus.edu" />
            {errors.email && <small>{errors.email.message}</small>}
          </label>

          <label>
            <span>Student ID</span>
            <input type="text" {...register('student_id')} placeholder="CSE-20218" />
            {errors.student_id && <small>{errors.student_id.message}</small>}
          </label>

          <label>
            <span>Phone number</span>
            <input type="tel" {...register('phone')} placeholder="+91 9876543210" />
            {errors.phone && <small>{errors.phone.message}</small>}
          </label>

          <label>
            <span>Password</span>
            <input type="password" {...register('password')} placeholder="Create a secure password" />
            {errors.password && <small>{errors.password.message}</small>}
          </label>

          <label>
            <span>Confirm password</span>
            <input type="password" {...register('confirmPassword')} placeholder="Confirm password" />
            {errors.confirmPassword && <small>{errors.confirmPassword.message}</small>}
          </label>

          <button type="submit" className="primary-btn full-width" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
