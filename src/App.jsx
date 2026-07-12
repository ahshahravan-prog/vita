import { useState, useEffect, useRef } from 'react'
import './App.css'

// ═══════════════════════════════════════════════════════════
// بخش ۱: توابع کمکی (Helper Functions)
// ═══════════════════════════════════════════════════════════

// تبدیل ساعت و دقیقه به فرمت قابل نمایش. مثلا (7, 30) → "07:30"
const fmtTime = (h, m = 0) =>
  `${(h % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

// اسلایدر ما از عدد استفاده میکنه (هر واحد = نیم ساعت)
// عدد 15 یعنی 7:30 چون 15 ÷ 2 = 7.5
const parseHalf = (v) => ({ h: Math.floor(v / 2), m: v % 2 === 0 ? 0 : 30 })
const toHalf = (h, m = 0) => h * 2 + (m >= 30 ? 1 : 0)

// تشخیص اینکه الان صبحه یا شب
const getPhase = () => {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// امروز چه تاریخیه؟ برای اینکه بفهمیم روز جدید شروع شده یا نه
const today = () => new Date().toISOString().split('T')[0]


// ═══════════════════════════════════════════════════════════
// بخش ۲: حافظه (localStorage)
// ═══════════════════════════════════════════════════════════
// این دو تابع، اطلاعات رو توی مرورگر ذخیره و بازیابی میکنن

const save = (key, value) => {
  try {
    localStorage.setItem('vita_' + key, JSON.stringify(value))
  } catch (e) {
    console.log('ذخیره نشد:', e)
  }
}

const load = (key) => {
  try {
    const data = localStorage.getItem('vita_' + key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}


// ═══════════════════════════════════════════════════════════
// بخش ۳: داده‌ها (Data)
// ═══════════════════════════════════════════════════════════

// جملات انگیزشی صبحگاهی
const QUOTES = [
  { text: 'انضباط، پلی‌ست بین اهداف و دستاوردها.', author: 'Jim Rohn' },
  { text: 'موفقیت مجموع تلاش‌های کوچکیه که هر روز تکرار میشن.', author: 'Robert Collier' },
  { text: 'عادت‌های روزانه‌ات سرنوشتت رو میسازن.', author: 'Aristotle' },
  { text: 'هر صبح دو انتخاب داری: ادامه خواب، یا بیدار شدن و دنبال کردن رویاهات.', author: 'Unknown' },
  { text: 'سختی‌ها نه برای شکستن تو، بلکه برای ساختن تو هستن.', author: 'Vita' },
  { text: 'یه قدم کوچیک هر روز، از یه جهش بزرگ یه‌بار در سال بهتره.', author: 'Vita' },
  { text: 'اول صبح رو ببر، روز رو بردی.', author: 'Robin Sharma' },
]

// جملات تاکیدی (Affirmations)
const AFFIRMATIONS = [
  'من هر روز قوی‌تر و بهتر میشم.',
  'من لایق بهترین‌ها هستم.',
  'من انرژی و آرامش دارم.',
  'من روی چیزایی که قابل کنترلن تمرکز میکنم.',
  'من امروز یه قدم به هدفم نزدیک‌تر میشم.',
]

// لیست مکمل‌های پیشنهادی
const SUPPLEMENTS = [
  { id: 'd3',     icon: '☀️', name: 'ویتامین D3',   dose: '2000 IU',    time: { h: 8,  m: 0  }, why: '۸۰٪ مردم کمبود دارن. ایمنی، خلق و استخوان.',           cat: 'پایه' },
  { id: 'k2',     icon: '🦴', name: 'ویتامین K2',   dose: '100 mcg',    time: { h: 8,  m: 0  }, why: 'کنار D3 ضروریه — کلسیم رو به استخوان میبره.',        cat: 'پایه' },
  { id: 'omega',  icon: '🐟', name: 'امگا ۳',       dose: '1-2 g',      time: { h: 13, m: 0  }, why: 'قلب، مغز و کاهش التهاب.',                             cat: 'پایه' },
  { id: 'mag',    icon: '🌙', name: 'منیزیم',       dose: '400 mg',     time: { h: 22, m: 0  }, why: 'خواب، استرس و ریکاوری عضله.',                        cat: 'پایه' },
  { id: 'zinc',   icon: '⚡', name: 'زینک',         dose: '15-30 mg',   time: { h: 21, m: 0  }, why: 'ایمنی و هورمون‌ها. شب بخور.',                        cat: 'ایمنی' },
  { id: 'vitc',   icon: '🍊', name: 'ویتامین C',    dose: '500-1000 mg',time: { h: 8,  m: 0  }, why: 'آنتی‌اکسیدان قوی. ایمنی و پوست.',                    cat: 'ایمنی' },
  { id: 'b12',    icon: '🔋', name: 'ویتامین B12',  dose: '500 mcg',    time: { h: 8,  m: 0  }, why: 'انرژی و سیستم عصبی.',                                cat: 'انرژی' },
  { id: 'creat',  icon: '💪', name: 'کراتین',       dose: '5 g',        time: { h: 9,  m: 0  }, why: 'قدرت، عضله و حتی حافظه.',                            cat: 'عملکرد' },
  { id: 'ash',    icon: '🌿', name: 'Ashwagandha',  dose: '300-600 mg', time: { h: 22, m: 30 }, why: 'کورتیزول رو ۳۰٪ کاهش میده. ضد استرس.',              cat: 'استرس' },
  { id: 'collag', icon: '✨', name: 'کلاژن',        dose: '10 g',       time: { h: 8,  m: 0  }, why: 'پوست، مو و مفاصل.',                                  cat: 'پوست' },
]


// ═══════════════════════════════════════════════════════════
// بخش ۴: ساخت روتین هوشمند
// ═══════════════════════════════════════════════════════════
// این تابع بر اساس ساعت‌های تو، یه برنامه واقع‌بینانه میسازه

function buildRoutine(wake, workStart, workEnd, sleep, supps) {
  const tasks = []

  // چقدر وقت آزاد داری؟ (به دقیقه)
  const morningFree = (workStart.h * 60 + workStart.m) - (wake.h * 60 + wake.m)

  // یه تابع کمکی برای اضافه کردن دقیقه به ساعت
  const addMin = (h, m, mins) => {
    const total = h * 60 + m + mins
    return { h: Math.floor(total / 60) % 24, m: total % 60 }
  }

  let t = { h: wake.h, m: wake.m }

  // ─── صبح ───
  tasks.push({ id: 'water_am', icon: '💧', title: '۲ لیوان آب بخور', desc: 'اول از همه — قبل از هر چیزی', ...t, cat: 'آب', points: 10 })
  t = addMin(t.h, t.m, 5)

  tasks.push({ id: 'skin_am', icon: '🧴', title: 'روتین پوستی صبح', desc: 'شستشو ← سرم ← مرطوب‌کننده ← ضدآفتاب', ...t, cat: 'پوست', points: 10 })
  t = addMin(t.h, t.m, 10)

  // مکمل‌های صبح (اگه انتخاب کرده باشی)
  const morningSupps = supps.filter(s => s.time.h < 12)
  if (morningSupps.length > 0) {
    tasks.push({ id: 'supp_am', icon: '💊', title: 'مکمل‌های صبح', desc: morningSupps.map(s => s.name).join('، '), ...t, cat: 'مکمل', points: 10 })
    t = addMin(t.h, t.m, 5)
  }

  // ورزش فقط اگه وقت داری (حداقل ۴۰ دقیقه)
  if (morningFree >= 40) {
    tasks.push({ id: 'exercise', icon: '🏃', title: 'ورزش', desc: 'حداقل ۳۰ دقیقه حرکت', ...t, cat: 'ورزش', points: 20 })
    t = addMin(t.h, t.m, 35)
  }

  // مدیتیشن اگه حداقل ۱۰ دقیقه وقت داری
  if (morningFree >= 15) {
    tasks.push({ id: 'meditate', icon: '🧘', title: 'مدیتیشن', desc: '۱۰ دقیقه — فقط نفس بکش', ...t, cat: 'ذهن', points: 15 })
    t = addMin(t.h, t.m, 12)
  }

  if (morningFree >= 20) {
    tasks.push({ id: 'breakfast', icon: '🥗', title: 'صبحانه سالم', desc: 'پروتئین + فیبر. از قند بپرهیز', ...t, cat: 'تغذیه', points: 15 })
  }

  // ─── یادآوری آب (هر ۲ ساعت) ───
  for (let hour = wake.h + 2; hour < sleep.h; hour += 2) {
    tasks.push({ id: `water_${hour}`, icon: '💧', title: 'آب بخور', desc: 'یه لیوان — هیدراته بمون', h: hour, m: 0, cat: 'آب', points: 5 })
  }

  // ─── بعدازظهر ───
  tasks.push({ id: 'lunch', icon: '🍱', title: 'ناهار سالم', desc: 'سبزیجات + پروتئین. از قند دوری کن', h: 13, m: 0, cat: 'تغذیه', points: 15 })
  tasks.push({ id: 'walk', icon: '🚶', title: 'پیاده‌روی ۱۵ دقیقه', desc: 'بعد از ناهار — قند خون رو تنظیم میکنه', h: 13, m: 30, cat: 'ورزش', points: 15 })

  const noonSupps = supps.filter(s => s.time.h >= 12 && s.time.h < 17)
  if (noonSupps.length > 0) {
    tasks.push({ id: 'supp_noon', icon: '💊', title: 'مکمل‌های بعدازظهر', desc: noonSupps.map(s => s.name).join('، '), h: 13, m: 30, cat: 'مکمل', points: 10 })
  }

  tasks.push({ id: 'no_sugar', icon: '⚠️', title: 'یادآوری: بدون قند', desc: 'قند = افت انرژی. آب یا میوه بخور', h: 15, m: 0, cat: 'تغذیه', points: 5 })

  // ─── عصر ───
  // اگه صبح وقت ورزش نداشتی، عصر بذارش
  if (morningFree < 40) {
    tasks.push({ id: 'exercise_pm', icon: '🏃', title: 'ورزش عصر', desc: 'صبح وقت نداشتی — الان جبران کن', h: workEnd.h + 1, m: 0, cat: 'ورزش', points: 20 })
  }

  tasks.push({ id: 'dinner', icon: '🍽️', title: 'شام سبک', desc: 'سبزیجات + پروتئین سبک', h: workEnd.h + 1, m: 30, cat: 'تغذیه', points: 10 })

  const eveSupps = supps.filter(s => s.time.h >= 17 && s.time.h < 22)
  if (eveSupps.length > 0) {
    tasks.push({ id: 'supp_eve', icon: '💊', title: 'مکمل‌های عصر', desc: eveSupps.map(s => s.name).join('، '), h: workEnd.h + 2, m: 0, cat: 'مکمل', points: 10 })
  }

  // ─── شب ───
  tasks.push({ id: 'no_screen', icon: '📵', title: 'گوشی رو کنار بذار', desc: 'یه ساعت قبل از خواب — ملاتونین تنظیم میشه', h: sleep.h - 1, m: 0, cat: 'خواب', points: 15 })
  tasks.push({ id: 'skin_pm', icon: '🌙', title: 'روتین پوستی شب', desc: 'پاک‌کننده ← تونر ← سرم شب ← مرطوب‌کننده', h: sleep.h - 1, m: 0, cat: 'پوست', points: 10 })

  const nightSupps = supps.filter(s => s.time.h >= 22)
  if (nightSupps.length > 0) {
    tasks.push({ id: 'supp_night', icon: '💊', title: 'مکمل‌های شب', desc: nightSupps.map(s => s.name).join('، '), h: sleep.h - 1, m: 30, cat: 'مکمل', points: 10 })
  }

  tasks.push({ id: 'journal', icon: '✍️', title: 'جرنال شبانه', desc: '۳ چیز خوب امروز رو بنویس', h: sleep.h - 1, m: 30, cat: 'ذهن', points: 10 })
  tasks.push({ id: 'sleep', icon: '😴', title: 'بخواب', desc: `ساعت ${fmtTime(sleep.h, sleep.m)} — خواب پایه همه چیزه`, h: sleep.h, m: sleep.m, cat: 'خواب', points: 20 })

  // مرتب کردن بر اساس ساعت
  return tasks
    .sort((a, b) => (a.h * 60 + a.m) - (b.h * 60 + b.m))
    .map(t => ({ ...t, done: false }))
}


// ═══════════════════════════════════════════════════════════
// بخش ۵: پاسخ‌های ویتا (بدون AI — فعلاً)
// ═══════════════════════════════════════════════════════════
// بعداً این رو با API واقعی جایگزین میکنیم

function vitaReply(userMsg, name, tasks) {
  const msg = userMsg.toLowerCase()
  const done = tasks.filter(t => t.done).length
  const total = tasks.length

  // اگه کاری انجام داده
  if (msg.startsWith('✓')) {
    const replies = [
      `عالی ${name}! هر قدم کوچیک مهمه. 💪`,
      `آفرین! ${done} از ${total} کار امروز انجام شد.`,
      `همینه ${name}! داری میسازیش. 🌱`,
      `خوبه! ادامه بده، روی مسیر درستی. ✨`,
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  // سوالای رایج
  if (msg.includes('خسته') || msg.includes('انرژی'))
    return `${name} جان، خستگی طبیعیه. یه لیوان آب بخور و ۵ دقیقه راه برو — معمولاً کمک میکنه. اگه خواب دیشب کم بوده، امشب زودتر بخواب.`

  if (msg.includes('نمیتونم بخوابم') || msg.includes('خواب'))
    return `برای خواب بهتر: اتاق رو خنک نگه دار (۱۸-۲۱ درجه)، یه ساعت قبل از خواب گوشی رو کنار بذار، و منیزیم کمک زیادی میکنه. تنفس ۴-۷-۸ هم امتحان کن.`

  if (msg.includes('وقت ندارم') || msg.includes('عقب'))
    return `اشکالی نداره ${name}. کوچ خوب به برنامه نمی‌چسبه، به نتیجه تو فکر میکنه. فقط یه کار کوچیک انجام بده — همون کافیه. فردا ادامه میدیم.`

  if (msg.includes('قند') || msg.includes('شیرینی'))
    return `پیش میاد! نگران نباش. یه لیوان آب بخور و ۱۰ دقیقه راه برو — قند خونت رو تنظیم میکنه. فردا روز جدیدیه.`

  if (msg.includes('مکمل'))
    return `مکمل‌هات رو تو تب مکمل‌ها میتونی ببینی. یادت باشه: قبل از شروع هر مکملی با پزشکت مشورت کن. 💊`

  if (msg.includes('انگیزه'))
    return `${name}، انگیزه میاد و میره — ولی عادت میمونه. به انگیزه تکیه نکن، به سیستم تکیه کن. همین کارای کوچیک روزانه، تو رو میسازن. 🌱`

  if (msg.includes('پوست'))
    return `روتین پوستی صبح: شستشو ← سرم ویتامین C ← مرطوب‌کننده ← ضدآفتاب.\nشب: پاک‌کننده ← تونر ← رتینول یا سرم ← مرطوب‌کننده.`

  if (msg.includes('سلام') || msg.includes('صبح'))
    return `سلام ${name}! ${done > 0 ? `تا الان ${done} کار انجام دادی — عالیه!` : 'بریم یه روز عالی بسازیم!'} 🌱`

  // پاسخ پیش‌فرض
  return `${name} جان، ${done} از ${total} کار امروز رو انجام دادی. ${done < total / 2 ? 'بریم قدم بعدی رو برداریم!' : 'داری عالی پیش میری!'} 💪`
}


// ═══════════════════════════════════════════════════════════
// بخش ۶: کامپوننت Onboarding (صفحه شروع)
// ═══════════════════════════════════════════════════════════

function Onboarding({ onFinish }) {
  const [step, setStep]     = useState(0)
  const [name, setName]     = useState('')
  const [wake, setWake]     = useState(toHalf(6, 30))
  const [ws, setWs]         = useState(toHalf(8, 0))
  const [we, setWe]         = useState(toHalf(17, 0))
  const [sl, setSl]         = useState(toHalf(23, 0))
  const [picked, setPicked] = useState([])

  const A = '#6EE7B7'  // رنگ اصلی

  // انتخاب یا لغو مکمل
  const toggleSupp = (id) => {
    setPicked(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const wakeObj = parseHalf(wake)
  const wsObj   = parseHalf(ws)
  const weObj   = parseHalf(we)
  const slObj   = parseHalf(sl)

  const morningFree = (wsObj.h * 60 + wsObj.m) - (wakeObj.h * 60 + wakeObj.m)
  const eveningFree = (slObj.h * 60 + slObj.m) - (weObj.h * 60 + weObj.m)

  // وقتی تموم شد
  const finish = () => {
    const chosenSupps = SUPPLEMENTS.filter(s => picked.includes(s.id))
    onFinish({
      name,
      wake: wakeObj,
      workStart: wsObj,
      workEnd: weObj,
      sleep: slObj,
      supps: chosenSupps,
    })
  }

  return (
    <div className="onboard">
      {/* نوار پیشرفت */}
      <div className="progress-dots">
        {[0, 1, 2].map(i => (
          <div key={i} className={`dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      {/* مرحله ۰ — اسم */}
      {step === 0 && (
        <div className="step">
          <div className="big-icon">🌱</div>
          <h1>سلام! من ویتام</h1>
          <p className="sub">کوچ شخصی روزانه‌ات.<br />هر روز کنارتم تا بهترین نسخه خودت باشی.</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
            placeholder="اسمت چیه؟"
            className="input"
          />
          <button
            onClick={() => setStep(1)}
            disabled={!name.trim()}
            className="btn-main"
          >
            بریم {name && `${name} جان`} ←
          </button>
        </div>
      )}

      {/* مرحله ۱ — ساعت‌ها */}
      {step === 1 && (
        <div className="step">
          <h1>ساعت روزت چطوره؟ ⏰</h1>
          <p className="sub">تا یه روتین واقعی بسازم — نه غیرممکن</p>

          <TimeSlider label="🌅 بیدار میشم"    value={wake} onChange={setWake} min={8}      max={22} />
          <TimeSlider label="💼 شروع کار"       value={ws}   onChange={setWs}   min={wake+1} max={28} />
          <TimeSlider label="🏠 تموم شدن کار"  value={we}   onChange={setWe}   min={ws+1}   max={40} />
          <TimeSlider label="🌙 میخوابم"        value={sl}   onChange={setSl}   min={we+1}   max={52} />

          {/* تحلیل وقت آزاد */}
          <div className="free-time">
            <div className="ft-title">وقت آزادت:</div>
            <div className="ft-row">
              <div className="ft-box">
                <div className="ft-icon">🌅</div>
                <div className="ft-val" style={{ color: morningFree < 60 ? '#F87171' : morningFree < 120 ? '#FBBF24' : A }}>
                  {Math.floor(morningFree / 60)}:{(morningFree % 60).toString().padStart(2, '0')}
                </div>
                <div className="ft-label">صبح</div>
              </div>
              <div className="ft-box">
                <div className="ft-icon">🌆</div>
                <div className="ft-val" style={{ color: eveningFree < 60 ? '#F87171' : eveningFree < 120 ? '#FBBF24' : A }}>
                  {Math.floor(eveningFree / 60)}:{(eveningFree % 60).toString().padStart(2, '0')}
                </div>
                <div className="ft-label">عصر</div>
              </div>
            </div>
            {morningFree < 60 && (
              <div className="warn">⚡ صبحت کمه — فقط کارای ضروری میذارم، بقیه رو میبرم عصر</div>
            )}
          </div>

          <button onClick={() => setStep(2)} className="btn-main">
            بعدی: مکمل‌ها ←
          </button>
        </div>
      )}

      {/* مرحله ۲ — مکمل‌ها */}
      {step === 2 && (
        <div className="step">
          <h1>مکمل‌های پیشنهادی 💊</h1>
          <p className="sub">
            هر کدوم رو قبول کنی، میره تو روتینت با ساعت دقیق.<br />
            <span className="tiny">⚠️ قبل از شروع با پزشک مشورت کن</span>
          </p>

          {['پایه', 'ایمنی', 'انرژی', 'عملکرد', 'استرس', 'پوست'].map(cat => {
            const items = SUPPLEMENTS.filter(s => s.cat === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="supp-group">
                <div className="supp-cat">{cat}</div>
                {items.map(s => (
                  <div
                    key={s.id}
                    onClick={() => toggleSupp(s.id)}
                    className={`supp-card ${picked.includes(s.id) ? 'picked' : ''}`}
                  >
                    <div className="supp-icon">{s.icon}</div>
                    <div className="supp-body">
                      <div className="supp-head">
                        <span className="supp-name">{s.name}</span>
                        <span className="supp-dose">{s.dose}</span>
                      </div>
                      <div className="supp-why">{s.why}</div>
                      <div className="supp-time">⏰ {fmtTime(s.time.h, s.time.m)}</div>
                    </div>
                    <div className={`check ${picked.includes(s.id) ? 'on' : ''}`}>✓</div>
                  </div>
                ))}
              </div>
            )
          })}

          <button onClick={finish} className="btn-main sticky">
            {picked.length > 0
              ? `روتین با ${picked.length} مکمل بساز 🚀`
              : 'بدون مکمل شروع کن 🚀'}
          </button>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// بخش ۷: اسلایدر زمان
// ═══════════════════════════════════════════════════════════

function TimeSlider({ label, value, onChange, min, max }) {
  const { h, m } = parseHalf(value)
  return (
    <div className="slider-box">
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-val">{fmtTime(h, m)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// بخش ۸: کارت تسک
// ═══════════════════════════════════════════════════════════

function TaskCard({ task, onDone, nowH, nowM }) {
  const taskMins = task.h * 60 + task.m
  const nowMins  = nowH * 60 + nowM

  const isNow  = taskMins <= nowMins && taskMins >= nowMins - 120  // تو ۲ ساعت اخیر
  const isPast = taskMins <= nowMins

  const catColors = {
    'آب': '#38BDF8', 'پوست': '#F472B6', 'مکمل': '#A78BFA',
    'ورزش': '#4ADE80', 'تغذیه': '#FBBF24', 'ذهن': '#818CF8', 'خواب': '#64748B',
  }
  const color = catColors[task.cat] || '#6EE7B7'

  return (
    <div
      onClick={() => !task.done && onDone(task.id)}
      className={`task ${task.done ? 'done' : ''} ${isNow ? 'now' : ''} ${!isPast ? 'future' : ''}`}
      style={{ borderRightColor: color }}
    >
      <div className="task-time">
        {fmtTime(task.h, task.m)}
        {isNow && !task.done && <div className="pulse-dot" />}
      </div>
      <div className="task-icon">{task.icon}</div>
      <div className="task-body">
        <div className="task-title">
          {task.title}
          <span className="task-cat" style={{ background: color + '22', color }}>{task.cat}</span>
        </div>
        <div className="task-desc">{task.desc}</div>
      </div>
      <div className={`task-check ${task.done ? 'on' : ''}`}>✓</div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// بخش ۹: کامپوننت اصلی — App
// ═══════════════════════════════════════════════════════════

function App() {
  // ─── State ها ───
  // useState یعنی: یه حافظه زنده که وقتی عوض شه، صفحه دوباره کشیده میشه

  const [user, setUser]       = useState(() => load('user'))       // اطلاعات کاربر
  const [tasks, setTasks]     = useState([])                       // کارهای امروز
  const [tab, setTab]         = useState('today')                  // تب فعال
  const [msgs, setMsgs]       = useState([])                       // پیام‌های چت
  const [input, setInput]     = useState('')                       // متن در حال تایپ
  const [points, setPoints]   = useState(() => load('points') || 0)
  const [streak, setStreak]   = useState(() => load('streak') || 0)
  const [now, setNow]         = useState({ h: new Date().getHours(), m: new Date().getMinutes() })

  const chatEnd = useRef(null)
  const A = '#6EE7B7'

  // ─── ساعت رو هر دقیقه آپدیت کن ───
  useEffect(() => {
    const timer = setInterval(() => {
      setNow({ h: new Date().getHours(), m: new Date().getMinutes() })
    }, 60000)
    return () => clearInterval(timer)  // پاک کردن تایمر موقع بستن
  }, [])

  // ─── وقتی کاربر لود شد، کارهای امروز رو بساز ───
  useEffect(() => {
    if (!user) return

    const savedDate  = load('date')
    const savedTasks = load('tasks')

    // اگه همون روزه، کارهای ذخیره‌شده رو بیار
    if (savedDate === today() && savedTasks) {
      setTasks(savedTasks)
    } else {
      // روز جدیده — روتین تازه بساز
      const fresh = buildRoutine(user.wake, user.workStart, user.workEnd, user.sleep, user.supps)
      setTasks(fresh)
      save('date', today())
      save('tasks', fresh)

      // streak رو حساب کن
      const lastDate = load('lastActiveDate')
      if (lastDate) {
        const diff = (new Date(today()) - new Date(lastDate)) / (1000 * 60 * 60 * 24)
        if (diff === 1) {
          setStreak(s => { const n = s + 1; save('streak', n); return n })
        } else if (diff > 1) {
          setStreak(1); save('streak', 1)
        }
      } else {
        setStreak(1); save('streak', 1)
      }
      save('lastActiveDate', today())
    }

    // پیام خوش‌آمد
    const savedMsgs = load('msgs')
    if (savedMsgs && savedDate === today()) {
      setMsgs(savedMsgs)
    } else {
      const greeting = { role: 'vita', text: `سلام ${user.name}! آماده‌ای یه روز عالی بسازیم؟ 🌱` }
      setMsgs([greeting])
      save('msgs', [greeting])
    }
  }, [user])

  // ─── هر بار tasks عوض شد، ذخیره کن ───
  useEffect(() => {
    if (tasks.length > 0) save('tasks', tasks)
  }, [tasks])

  // ─── اسکرول به آخر چت ───
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // ─── وقتی onboarding تموم شد ───
  const handleOnboard = (userData) => {
    save('user', userData)
    setUser(userData)
  }

  // ─── انجام دادن یه کار ───
  const markDone = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.done) return

    const updated = tasks.map(t => t.id === taskId ? { ...t, done: true } : t)
    setTasks(updated)

    const newPoints = points + task.points
    setPoints(newPoints)
    save('points', newPoints)

    // ویتا واکنش نشون میده
    const userMsg = { role: 'user', text: `✓ ${task.title}` }
    const vitaMsg = { role: 'vita', text: vitaReply(`✓ ${task.title}`, user.name, updated) }
    const newMsgs = [...msgs, userMsg, vitaMsg]
    setMsgs(newMsgs)
    save('msgs', newMsgs)
  }

  // ─── فرستادن پیام ───
  const sendMsg = () => {
    if (!input.trim()) return

    const userMsg = { role: 'user', text: input }
    const vitaMsg = { role: 'vita', text: vitaReply(input, user.name, tasks) }
    const newMsgs = [...msgs, userMsg, vitaMsg]

    setMsgs(newMsgs)
    save('msgs', newMsgs)
    setInput('')
  }

  // ─── ریست کردن همه چی (برای تست) ───
  const resetAll = () => {
    if (confirm('همه اطلاعات پاک بشه؟')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  // ─── اگه کاربر نداریم، Onboarding نشون بده ───
  if (!user) {
    return <Onboarding onFinish={handleOnboard} />
  }

  // ─── محاسبات ───
  const doneCount = tasks.filter(t => t.done).length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
  const currentTask = tasks.find(t => !t.done && (t.h * 60 + t.m) <= (now.h * 60 + now.m))

  // جمله انگیزشی امروز (بر اساس تاریخ ثابته)
  const dayIndex = new Date().getDate()
  const quote = QUOTES[dayIndex % QUOTES.length]
  const affirmation = AFFIRMATIONS[dayIndex % AFFIRMATIONS.length]

  const phase = getPhase()
  const QUICK = {
    morning:   ['از کجا شروع کنم؟', 'خسته‌ام', 'وقت ندارم'],
    afternoon: ['ناهار چی بخورم؟', 'عقب افتادم', 'انرژی ندارم'],
    evening:   ['مکمل شبم چیه؟', 'روتین پوستی شب', 'ورزش نکردم'],
    night:     ['نمیتونم بخوابم', 'انگیزه ندارم', 'امروز چطور بود؟'],
  }

  return (
    <div className="app">
      {/* ═══ هدر ═══ */}
      <div className="header">
        <div className="header-top">
          <div className="brand">
            <div className="logo">🌱</div>
            <div>
              <div className="brand-name">ویتا</div>
              <div className="brand-sub">
                <span className="live-dot" />
                {user.name} · {points} امتیاز
                {streak > 1 && <span className="streak"> · 🔥 {streak} روز</span>}
              </div>
            </div>
          </div>
          <div className="score">
            <div className="score-pct">{pct}%</div>
            <div className="score-sub">{doneCount}/{tasks.length}</div>
          </div>
        </div>

        {/* نوار پیشرفت */}
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* کار فعلی */}
        {currentTask && (
          <div className="current">
            <span className="current-icon">{currentTask.icon}</span>
            <div className="current-body">
              <div className="current-label">الان نوبت:</div>
              <div className="current-title">{currentTask.title}</div>
            </div>
            <button onClick={() => markDone(currentTask.id)} className="current-btn">
              انجام شد ✓
            </button>
          </div>
        )}

        {/* تب‌ها */}
        <div className="tabs">
          {[
            ['today', '📋 امروز'],
            ['chat',  '💬 ویتا'],
            ['supps', '💊 مکمل‌ها'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`tab ${tab === id ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ محتوا ═══ */}
      <div className="content">

        {/* ─── تب امروز ─── */}
        {tab === 'today' && (
          <div className="today">
            {/* جمله انگیزشی */}
            <div className="quote-box">
              <div className="quote-icon">💬</div>
              <div className="quote-text">"{quote.text}"</div>
              <div className="quote-author">— {quote.author}</div>
            </div>

            {/* جمله تاکیدی */}
            <div className="affirm-box">
              <div className="affirm-label">✨ جمله امروزت</div>
              <div className="affirm-text">{affirmation}</div>
            </div>

            {/* لیست کارها */}
            <div className="tasks">
              {tasks.map(t => (
                <TaskCard key={t.id} task={t} onDone={markDone} nowH={now.h} nowM={now.m} />
              ))}
            </div>

            <button onClick={resetAll} className="reset-btn">
              🔄 ریست کامل (برای تست)
            </button>
          </div>
        )}

        {/* ─── تب چت ─── */}
        {tab === 'chat' && (
          <div className="chat">
            <div className="messages">
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  {m.role === 'vita' && <div className="msg-avatar">🌱</div>}
                  <div className="msg-bubble">{m.text}</div>
                </div>
              ))}
              <div ref={chatEnd} />
            </div>

            {/* پیشنهادهای سریع */}
            <div className="quick">
              {(QUICK[phase] || []).map(q => (
                <button key={q} onClick={() => setInput(q)} className="quick-btn">
                  {q}
                </button>
              ))}
            </div>

            {/* ورودی */}
            <div className="input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                placeholder="بگو ویتا..."
                className="chat-input"
              />
              <button onClick={sendMsg} disabled={!input.trim()} className="send-btn">↑</button>
            </div>
          </div>
        )}

        {/* ─── تب مکمل‌ها ─── */}
        {tab === 'supps' && (
          <div className="supps-tab">
            <p className="supps-intro">
              مکمل‌های فعال تو روتینت — هر کدوم در بهترین زمان.
            </p>
            {user.supps.length === 0 ? (
              <div className="empty">مکملی انتخاب نکردی</div>
            ) : (
              user.supps.map(s => (
                <div key={s.id} className="supp-active">
                  <div className="supp-icon">{s.icon}</div>
                  <div className="supp-body">
                    <div className="supp-head">
                      <span className="supp-name">{s.name}</span>
                      <span className="supp-dose">{s.dose}</span>
                    </div>
                    <div className="supp-why">{s.why}</div>
                    <div className="supp-time">⏰ {fmtTime(s.time.h, s.time.m)}</div>
                  </div>
                </div>
              ))
            )}
            <div className="disclaimer">
              ⚠️ قبل از شروع هر مکملی با پزشک مشورت کن
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
