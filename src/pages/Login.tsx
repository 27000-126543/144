import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Leaf,
  ShoppingCart,
  FlaskConical,
  Award,
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import type { UserRole } from '../types';
import { roleLabels } from '../types';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/MessageToast';
import { cn } from '../lib/utils';

const roles: { role: Exclude<UserRole, 'consumer'>; icon: typeof Leaf; color: string }[] = [
  { role: 'farmer', icon: Leaf, color: 'from-green-400 to-green-600' },
  { role: 'buyer', icon: ShoppingCart, color: 'from-blue-400 to-blue-600' },
  { role: 'inspector', icon: FlaskConical, color: 'from-purple-400 to-purple-600' },
  { role: 'certifier', icon: Award, color: 'from-amber-400 to-amber-600' },
  { role: 'regulator', icon: Building2, color: 'from-red-400 to-red-600' },
];

const loginSchema = z.object({
  username: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuthStore();
  const toast = useToast();

  const state = location.state as { selectedRole?: UserRole } | null;
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'consumer'> | null>(
    state?.selectedRole && state.selectedRole !== 'consumer'
      ? (state.selectedRole as Exclude<UserRole, 'consumer'>)
      : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: true,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem('remembered-login');
    if (saved) {
      try {
        const { username, remember } = JSON.parse(saved);
        setValue('username', username);
        setValue('remember', remember);
      } catch {
        // ignore
      }
    }
  }, [setValue]);

  useEffect(() => {
    if (error) {
      setShakeError(true);
      toast.error('登录失败', error);
      const timer = setTimeout(() => {
        setShakeError(false);
        clearError();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, toast, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    if (!selectedRole) return;

    try {
      await login({
        username: data.username,
        password: data.password,
        role: selectedRole,
      });

      if (data.remember) {
        localStorage.setItem('remembered-login', JSON.stringify({
          username: data.username,
          remember: true,
        }));
      } else {
        localStorage.removeItem('remembered-login');
      }

      toast.success('登录成功', `欢迎回来，${roleLabels[selectedRole]}`);

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || `/${selectedRole}/dashboard`, { replace: true });
    } catch {
      // error handled in useEffect
    }
  };

  const handleRoleSelect = (role: Exclude<UserRole, 'consumer'>) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    if (selectedRole) {
      setSelectedRole(null);
    } else {
      navigate('/');
    }
  };

  const selectedRoleData = roles.find((r) => r.role === selectedRole);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700">
        <div className="absolute inset-0 bg-agri-pattern opacity-10" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl opacity-20 translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-400 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="role-select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-2xl"
              >
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center"
                  >
                    <Leaf className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-white mb-3">选择您的角色</h1>
                  <p className="text-white/70">请选择您的身份以进入对应登录页面</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {roles.map((roleItem, index) => {
                    const Icon = roleItem.icon;
                    return (
                      <motion.button
                        key={roleItem.role}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleSelect(roleItem.role)}
                        className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                      >
                        <div
                          className={cn(
                            'w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                            `bg-gradient-to-br ${roleItem.color}`
                          )}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-white font-medium text-sm">
                          {roleLabels[roleItem.role]}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-10 text-center"
                >
                  <p className="text-white/50 text-sm">
                    消费者请前往
                    <button
                      onClick={() => navigate('/consumer/trace')}
                      className="text-white underline underline-offset-2 hover:text-green-300 mx-1"
                    >
                      追溯查询
                    </button>
                    页面
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <div
                    className={cn(
                      'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl',
                      `bg-gradient-to-br ${selectedRoleData?.color}`
                    )}
                  >
                    {selectedRoleData && (
                      <selectedRoleData.icon className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {roleLabels[selectedRole]}登录
                  </h1>
                  <p className="text-white/70">请输入您的账号和密码</p>
                </motion.div>

                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className={cn(
                    'glass-card rounded-3xl p-8',
                    shakeError && 'animate-shake'
                  )}
                >
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        账号
                      </label>
                      <input
                        type="text"
                        placeholder="请输入账号"
                        className={cn(
                          'input-field',
                          errors.username && 'border-red-300 focus:ring-red-500'
                        )}
                        {...register('username')}
                      />
                      <AnimatePresence>
                        {errors.username && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1 text-sm text-red-500"
                          >
                            {errors.username.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        密码
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="请输入密码"
                          className={cn(
                            'input-field pr-12',
                            errors.password && 'border-red-300 focus:ring-red-500'
                          )}
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-1 text-sm text-red-500"
                          >
                            {errors.password.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          {...register('remember')}
                        />
                        <span className="text-sm text-gray-600">记住密码</span>
                      </label>
                      <button type="button" className="text-sm text-green-600 hover:text-green-700">
                        忘记密码？
                      </button>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || !isDirty}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full btn-primary flex items-center justify-center gap-2',
                        (loading || !isDirty) && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>登录中...</span>
                        </>
                      ) : (
                        <span>登录</span>
                      )}
                    </motion.button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-500">
                      测试账号：{selectedRole}1 / 123456
                    </p>
                  </div>
                </motion.form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-center"
                >
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    ← 切换角色
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="p-6 text-center text-white/50 text-sm">
          <p>© 2024 农产品质量安全追溯平台. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
