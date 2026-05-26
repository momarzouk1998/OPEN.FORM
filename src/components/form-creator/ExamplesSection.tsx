'use client'

export default function ExamplesSection() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
      <h3 className="text-lg font-bold text-amber-800 mb-4">💡 أمثلة عملية لأنواع الأسئلة</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">T</span>
            <span className="font-medium text-gray-800">نص قصير</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">ما اسم المسجد الذي تصلي فيه؟</p>
          <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
            إجابة: مسجد النور
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">¶</span>
            <span className="font-medium text-gray-800">نص طويل</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">اكتب عن شعورك أثناء قراءة القرآن</p>
          <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
            إجابة: أشعر بالسكينة والطمأنينة...
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">○</span>
            <span className="font-medium text-gray-800">اختيار واحد</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">في أي وقت تصلي الفجر؟</p>
          <div className="space-y-1 text-xs text-gray-500">
            <div>○ قبل الأذان (5 نقاط)</div>
            <div>○ مع الأذان (4 نقاط)</div>
            <div>○ بعد الأذان بـ15 دقيقة (3 نقاط)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">☑</span>
            <span className="font-medium text-gray-800">اختيار متعدد</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">ما الأعمال الصالحة التي تقوم بها؟</p>
          <div className="space-y-1 text-xs text-gray-500">
            <div>☑ الصلاة في وقتها (2 نقاط)</div>
            <div>☑ قراءة القرآن (2 نقاط)</div>
            <div>☐ الصدقة (2 نقاط)</div>
            <div>☑ الذكر (1 نقطة)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">⭐</span>
            <span className="font-medium text-gray-800">تقييم</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">قيم مستوى خشوعك في الصلاة</p>
          <div className="flex justify-between text-xs text-gray-500">
            <span>⭐☆☆☆☆ ضعيف</span>
            <span>⭐⭐⭐⭐⭐ ممتاز</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">#</span>
            <span className="font-medium text-gray-800">ترتيب</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">رتب العبادات حسب أولويتك</p>
          <div className="space-y-1 text-xs text-gray-500">
            <div>1. الصلاة (5 نقاط)</div>
            <div>2. قراءة القرآن (4 نقاط)</div>
            <div>3. الذكر (3 نقاط)</div>
            <div>4. الصدقة (2 نقاط)</div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-100 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>نصيحة:</strong> استخدم أنواع الأسئلة المختلفة لجعل النموذج أكثر تفاعلاً وشمولية.
          يمكنك دمج عدة أنواع في نموذج واحد لتغطية جوانب مختلفة من الموضوع.
        </p>
      </div>
    </div>
  )
}
