import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  ShoppingCart,
  FlaskConical,
  Award,
  Building2,
  Users,
  ShieldCheck,
  BarChart3,
  QrCode,
  FileCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { UserRole } from '../types';
import { roleLabels } from '../types';
import { cn } from '../lib/utils';

const roles: { role: UserRole; icon: typeof Leaf; color: string; description: string }[] = [
  { role: 'farmer', icon: Leaf, color: 'from-green-400 to-green-600', description: '种植管理、追溯码申请、补贴申领' },
  { role: 'buyer', icon: ShoppingCart, color: 'from-blue-400 to-blue-600', description: '扫码收购、批次管理、预检检测' },
  { role: 'inspector', icon: FlaskConical, color: 'from-purple-400 to-purple-600', description: '抽检任务、检测报告、质量分析' },
  { role: 'certifier', icon: Award, color: 'from-amber-400 to-amber-600', description: '认证审核、证书管理、资质认定' },
  { role: 'regulator', icon: Building2, color: 'from-red-400 to-red-600', description: '监管预警、阈值设置、补贴审批' },
  { role: 'consumer', icon: Users, color: 'from-teal-400 to-teal-600', description: '追溯查询、证书验证、在线投诉' },
];

const features = [
  { icon: QrCode, title: '一物一码', description: '每批次农产品唯一追溯码，全链条信息可查' },
  { icon: ShieldCheck, title: '安全保障', description: '农药残留检测、认证管理，确保食品安全' },
  { icon: FileCheck, title: '透明可信', description: '区块链存证，数据不可篡改，增强消费者信任' },
  { icon: BarChart3, title: '智能分析', description: '大数据分析，辅助监管决策，提升管理效率' },
];

export default function Home() {
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState<UserRole | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    if (role === 'consumer') {
      navigate('/consumer/trace');
    } else {
      navigate('/login', { state: { selectedRole: role } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-agri-pattern opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <header className="bg-white/80 backdrop-blur-lg border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">农产品质量安全追溯平台</h1>
                  <p className="text-xs text-gray-500">Agricultural Product Traceability System</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/consumer/trace')}
                  className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  追溯查询
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary text-sm px-4 py-2"
                >
                  登录
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>智慧农业 · 安全追溯 · 可信消费</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="gradient-text">从田间到餐桌</span>
                <br />
                <span className="text-gray-800">全链条质量安全追溯</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                构建农产品质量安全追溯体系，实现生产、加工、流通、消费全环节可追溯，
                保障食品安全，提升农产品品质，增强消费者信心。
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/consumer/trace')}
                  className="btn-primary flex items-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  立即查询
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary flex items-center gap-2"
                >
                  了解更多
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center mb-12"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">选择您的角色</h3>
              <p className="text-gray-600">不同角色拥有不同的功能权限，点击进入对应工作台</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((roleItem, index) => {
                const Icon = roleItem.icon;
                const isHovered = hoveredRole === roleItem.role;
                return (
                  <motion.div
                    key={roleItem.role}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onMouseEnter={() => setHoveredRole(roleItem.role)}
                    onMouseLeave={() => setHoveredRole(null)}
                    onClick={() => handleRoleSelect(roleItem.role)}
                    className={cn(
                      'relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-500',
                      'bg-white border-2',
                      isHovered ? 'border-green-400 shadow-2xl' : 'border-gray-100 shadow-lg hover:shadow-xl'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute inset-0 opacity-0 transition-opacity duration-500',
                        `bg-gradient-to-br ${roleItem.color}`,
                        isHovered && 'opacity-5'
                      )}
                    />
                    <div className="p-6 relative z-10">
                      <div
                        className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
                          `bg-gradient-to-br ${roleItem.color}`,
                          isHovered && 'scale-110 shadow-lg'
                        )}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">
                        {roleLabels[roleItem.role]}
                      </h4>
                      <p className="text-gray-600 text-sm mb-4">
                        {roleItem.description}
                      </p>
                      <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                        <span>进入工作台</span>
                        <motion.div
                          animate={{ x: isHovered ? 4 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white/60 backdrop-blur">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">平台特色功能</h3>
              <p className="text-gray-600">全方位保障农产品质量安全</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-lg card-hover"
                  >
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-green-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-3xl p-8 lg:p-12 text-center"
            >
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                立即开始使用农产品追溯平台
              </h3>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                扫码查询农产品溯源信息，了解从种植到流通的全过程，让消费更放心。
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/consumer/trace')}
                  className="btn-primary flex items-center gap-2"
                >
                  <QrCode className="w-5 h-5" />
                  扫码追溯
                </button>
                <button
                  onClick={() => navigate('/consumer/complaint')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ShieldCheck className="w-5 h-5" />
                  我要投诉
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold">农产品质量安全追溯平台</h4>
                    <p className="text-xs text-gray-400">Agricultural Product Traceability</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">
                  构建从田间到餐桌的全链条质量安全追溯体系，保障食品安全，让消费者买得放心、吃得安心。
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-4">快速链接</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => navigate('/consumer/trace')}>追溯查询</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => navigate('/consumer/complaint')}>在线投诉</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => navigate('/consumer/certificate')}>证书验证</li>
                  <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => navigate('/login')}>用户登录</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-4">联系我们</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>服务热线：400-888-8888</li>
                  <li>工作时间：周一至周五 9:00-18:00</li>
                  <li>邮箱：support@agri-trace.com</li>
                  <li>地址：北京市海淀区中关村软件园</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
              <p>© 2024 农产品质量安全追溯平台. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
