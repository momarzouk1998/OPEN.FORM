const fs = require('fs');
const path = require('path');

const templates = [
  {
    name: 'تقييم مطعم / مقهى',
    description: 'نموذج مخصص لأصحاب المطاعم والمقاهي لقياس رضا الزوار عن جودة الطعام والخدمة.',
    category: 'survey',
    questions: [
      { text: 'الفرع الذي قمت بزيارته', type: 'dropdown', required: true, options: ['الفرع الرئيسي', 'فرع المول', 'فرع الكورنيش'] },
      { text: 'كيف تقيم جودة ومذاق الطعام؟', type: 'scale', required: true, options: ['1','2','3','4','5'] },
      { text: 'كيف تقيم سرعة تقديم الخدمة؟', type: 'scale', required: true, options: ['1','2','3','4','5'] },
      { text: 'كيف تقيم نظافة المكان؟', type: 'scale', required: true, options: ['1','2','3','4','5'] },
      { text: 'هل واجهتك أي مشكلة أثناء زيارتك؟', type: 'textarea', required: false },
      { text: 'ما هو الطبق المفضل لديك من قائمتنا؟', type: 'text', required: false }
    ],
    sort_order: 29
  },
  {
    name: 'اشتراك في نادي رياضي (جيم)',
    description: 'استمارة تسجيل عضوية جديدة في الأندية الرياضية ومراكز اللياقة البدنية.',
    category: 'registration',
    questions: [
      { text: 'الاسم الثلاثي', type: 'text', required: true },
      { text: 'رقم الجوال', type: 'text', required: true },
      { text: 'الوزن الحالي (كجم)', type: 'text', required: true },
      { text: 'الطول (سم)', type: 'text', required: true },
      { text: 'نوع الاشتراك المطلوب', type: 'single_choice', required: true, options: ['شهر واحد', '3 أشهر', '6 أشهر', 'سنة كاملة'] },
      { text: 'هل ترغب في الحصول على مدرب شخصي (PT)؟', type: 'single_choice', required: true, options: ['نعم', 'لا'] },
      { text: 'هل تعاني من أي إصابات أو أمراض مزمنة؟ (الرجاء التوضيح)', type: 'textarea', required: false }
    ],
    sort_order: 30
  }
];

let qIdCount = 3000;
let oIdCount = 4000;

function buildSql(template) {
  const questionsJson = template.questions.map((q, i) => {
    const qObj = {
      id: "t_q_" + (qIdCount++),
      text: q.text,
      type: q.type,
      required: q.required,
      points: 0,
      options: [],
      order_index: i
    };
    if (q.options) {
      qObj.options = q.options.map((opt) => {
        const optionObj = {
          id: "t_o_" + (oIdCount++),
          text: opt,
          points: q.type === 'scale' ? parseInt(opt) : 0
        };
        return optionObj;
      });
      if (q.type === 'dropdown') {
        qObj.dropdown_type = 'single';
      }
    }
    return qObj;
  });

  const qJsonStr = JSON.stringify(questionsJson).replace(/'/g, "''");
  const formSettings = '{"allow_multiple":true,"time_limit":null,"randomize_questions":false}';
  
  return `(
  '${template.name}',
  '${template.description}',
  '${template.category}',
  '${qJsonStr}'::jsonb,
  '${formSettings}'::jsonb,
  false, ${template.sort_order}
)`;
}

const sqlValues = templates.map(buildSql).join(',\n');

const appendSql = `

-- 2 Additional Templates (Requested by user)
INSERT INTO form_templates (name, description, category, questions_data, form_settings, is_featured, sort_order) VALUES
${sqlValues}
ON CONFLICT (id) DO NOTHING;
`;

const targetFile = path.join(__dirname, 'sql', '002_form_templates.sql');
fs.appendFileSync(targetFile, appendSql);
console.log('Successfully appended 2 more templates to sql/002_form_templates.sql');
