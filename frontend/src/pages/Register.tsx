import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/api';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name) {
      newErrors.name = 'Nama diperlukan';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
    }

    if (!formData.email) {
      newErrors.email = 'Email diperlukan';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password diperlukan';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Konfirmasi password diperlukan';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await authService.register(formData);
      
      setUser(response.user);
      setToken(response.token);
      navigate('/chat');
    } catch (error: any) {
      setErrors({ general: error.message || 'Registrasi gagal. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="form-container">
        <div className="text-center mb-8">
          <h1 className="logo">WhatsApp Clone</h1>
          <p className="logo-subtitle">Buat akun baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm animate-slide-in">
              {errors.general}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="Masukkan nama lengkap Anda"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1 animate-slide-in">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="Masukkan email Anda"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1 animate-slide-in">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input-field ${errors.password ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="Masukkan password Anda"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1 animate-slide-in">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-semibold text-gray-700 mb-2">
              Konfirmasi Password
            </label>
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              className={`input-field ${errors.password_confirmation ? 'border-red-500 focus:ring-red-200' : ''}`}
              placeholder="Konfirmasi password Anda"
            />
            {errors.password_confirmation && (
              <p className="text-red-600 text-sm mt-1 animate-slide-in">{errors.password_confirmation}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2"></div>
                Mendaftar...
              </>
            ) : (
              'Daftar'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200">
              Masuk di sini
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Dengan mendaftar, Anda menyetujui{' '}
            <a href="#" className="text-green-600 hover:text-green-700">Syarat & Ketentuan</a>{' '}
            dan{' '}
            <a href="#" className="text-green-600 hover:text-green-700">Kebijakan Privasi</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 