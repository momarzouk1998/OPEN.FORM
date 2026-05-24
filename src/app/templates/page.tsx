"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Briefcase, ShoppingCart, UserCheck, Stethoscope, Sparkles, ChevronLeft, GraduationCap, LayoutTemplate } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Define the template type from the database
interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questions_data: any[];
  source?: 'form_templates' | 'user_templates';
  usage_count?: number;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTemplates = async () => {
      // fetch curated templates and user-created approved templates
      const [built] = await Promise.all([
        supabase.from('form_templates').select('*').order('sort_order', { ascending: true }),
        supabase.from('user_templates').select('*').eq('approved', true).order('created_at', { ascending: false })
      ])

      const builtData: any[] = built.data || []
      // second result is ignored in destructuring above because Promise.all returns array; fetch separately
      const { data: userTemplates } = await supabase.from('user_templates').select('*').eq('approved', true).order('created_at', { ascending: false })

      const merged: FormTemplate[] = [
        ...builtData.map((t: any) => ({ ...t, source: 'form_templates' })),
        ...(userTemplates || []).map((t: any) => ({ ...t, source: 'user_templates' }))
      ]

      setTemplates(merged)
      setLoading(false)
    }

    fetchTemplates()
  }, [])

  // Helper to get nice icons and colors based on the DB category
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'medical':
        return {
          icon: <Stethoscope className="w-8 h-8 text-brand-500" />,
          color: "from-brand-500/20 to-teal-500/20"
        };
      case 'employment':
        return {
          icon: <Briefcase className="w-8 h-8 text-blue-500" />,
          color: "from-blue-500/20 to-cyan-500/20"
        };
      case 'education':
        return {
          icon: <GraduationCap className="w-8 h-8 text-purple-500" />,
          color: "from-purple-500/20 to-pink-500/20"
        };
      case 'survey':
        return {
          icon: <UserCheck className="w-8 h-8 text-green-500" />,
          color: "from-green-500/20 to-emerald-500/20"
        };
      default:
        return {
          icon: <LayoutTemplate className="w-8 h-8 text-orange-500" />,
          color: "from-orange-500/20 to-red-500/20"
        };
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center mb-16 mt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-brand-600 font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>مكتبة القوالب الذكية</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl font-black mb-6 text-foreground tracking-tight"
        >
          ابدأ بنموذج احترافي <span className="text-brand-500">بضغطة زر</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-slate-500 max-w-2xl"
        >
          اختر من قوالبنا الجاهزة والمصممة بعناية لتناسب كافة احتياجاتك، أو دع الذكاء الاصطناعي يبني نموذجك الخاص من الصفر.
        </motion.p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {templates.map((template, index) => {
            const theme = getCategoryTheme(template.category);
            const questionsCount = template.questions_data?.length || 0;
            
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-panel p-6 rounded-3xl relative overflow-hidden group cursor-pointer flex flex-col h-full"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.color} rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6">
                    {theme.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3">{template.name}</h3>
                  <p className="text-slate-500 mb-6 leading-relaxed flex-grow">{template.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <span className="text-sm font-medium text-slate-400">{questionsCount} أسئلة</span>
                    <Link href={`/templates/${template.id}`} className="text-brand-500 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      معاينة واستخدام
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
