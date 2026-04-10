type NavItem = {
  href: string;
  label: string;
};

type FeatureCard = {
  title: string;
  description: string;
};

type ShowcaseCard = {
  title: string;
  description: string;
  badge: string;
};

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

const navItems: NavItem[] = [
  { href: "#features", label: "服务" },
  { href: "#showcase", label: "灵感" },
  { href: "#stories", label: "故事" },
];

const featureCards: FeatureCard[] = [
  {
    title: "柔和课程结构",
    description: "把每日任务拆成轻量步骤，减少压力感，让节奏更稳定。",
  },
  {
    title: "疗愈式专注体验",
    description: "低饱和配色与温和反馈结合，帮助你在安静氛围中持续投入。",
  },
  {
    title: "轻陪伴成长记录",
    description: "每次完成都会沉淀为可视化轨迹，看到自己稳定变好的过程。",
  },
];

const showcaseCards: ShowcaseCard[] = [
  {
    badge: "Morning Flow",
    title: "清晨 20 分钟微学习",
    description: "使用柔和提示与阶段目标，在起床后快速进入专注状态。",
  },
  {
    badge: "Evening Reset",
    title: "晚间复盘与呼吸节奏",
    description: "把一天的学习沉淀成轻量笔记，安心收束情绪，准备明天。",
  },
  {
    badge: "Studio Notes",
    title: "美感化学习看板",
    description: "将计划、习惯与奖励放在同一视图里，随时掌握状态与平衡。",
  },
];

const testimonials: Testimonial[] = [
  {
    quote: "页面很安静，能让我更容易开始，而不是被任务量吓到。",
    author: "Mia",
    role: "独立设计师",
  },
  {
    quote: "这种柔和风格很像生活方式品牌，学习也变得更有仪式感。",
    author: "Yun",
    role: "内容创作者",
  },
];

function CtaButton({
  children,
  href,
  variant = "primary",
}: {
  children: string;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const commonClasses =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-strong)]";
  const variantClasses =
    variant === "primary"
      ? "bg-[var(--brand-strong)] text-[var(--text-on-brand)] shadow-[0_14px_32px_-18px_rgba(63,122,97,0.9)] hover:bg-[var(--brand-hover)]"
      : "border border-[var(--brand)] bg-[var(--card-bg)] text-[var(--brand-strong)] hover:border-[var(--brand-strong)] hover:bg-[var(--section-bg)]";
  return (
    <a className={`${commonClasses} ${variantClasses}`} href={href}>
      {children}
    </a>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">{description}</p>
    </header>
  );
}

export function Homepage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:rgba(247,248,242,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a className="inline-flex items-center gap-3 text-lg font-semibold text-[var(--text-primary)]" href="#">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-strong)]">
              XIU
            </span>
            Soft Studio
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm text-[var(--text-secondary)] md:flex">
            {navItems.map((item) => (
              <a className="transition-colors hover:text-[var(--brand-strong)]" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <CtaButton href="#final">开始体验</CtaButton>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[var(--hero-bg)]">
          <div className="hero-blob hero-blob-left" />
          <div className="hero-blob hero-blob-right" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
            <div className="relative z-10">
              <p className="inline-flex rounded-full border border-[var(--border)] bg-[color:rgba(255,255,255,0.7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Calm • Healing • Minimal
              </p>
              <h1 className="mt-7 text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                在柔和节奏里，
                <br />
                让学习慢慢变成一种享受。
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
                用低饱和色彩、轻盈结构和温和引导，打造一页就能感受到安心感的生活方式学习主页。
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <CtaButton href="#features">立即探索</CtaButton>
                <CtaButton href="#showcase" variant="secondary">
                  查看界面
                </CtaButton>
              </div>
            </div>

            <aside className="relative z-10 rounded-[2rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.72)] p-6 shadow-soft-card backdrop-blur-md sm:p-8">
              <p className="text-sm font-semibold text-[var(--text-muted)]">今日氛围</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">Fresh Calm Studio</p>
              <div className="mt-6 space-y-4">
                <article className="rounded-3xl bg-[var(--section-bg)] p-4">
                  <p className="text-sm text-[var(--text-muted)]">柔和配色体验</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--brand-strong)]">96%</p>
                </article>
                <article className="rounded-3xl bg-[var(--accent-bg)] p-4">
                  <p className="text-sm text-[var(--text-muted)]">页面呼吸感评分</p>
                  <p className="mt-1 text-xl font-semibold text-[var(--brand-strong)]">A+</p>
                </article>
                <article className="rounded-3xl bg-[var(--card-bg)] p-4 shadow-soft-float">
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    “像一个安静的生活工作室，而不是一堆冷冰冰的按钮。”
                  </p>
                </article>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[var(--page-bg)] px-5 py-20 sm:px-8" id="features">
          <div className="mx-auto w-full max-w-6xl">
            <SectionTitle
              description="以温润卡片、圆角模块和清晰层级构建核心体验，让内容易读、操作自然、情绪稳定。"
              eyebrow="Features"
              title="轻盈但完整的首页结构"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featureCards.map((feature) => (
                <article
                  className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-soft-card"
                  key={feature.title}
                >
                  <h3 className="text-xl font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--accent-bg)] px-5 py-16 sm:px-8">
          <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[color:rgba(63,122,97,0.15)] bg-[color:rgba(255,255,255,0.5)] px-6 py-10 text-center shadow-soft-float sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Highlight</p>
            <p className="mt-4 text-2xl font-semibold leading-snug text-[var(--text-primary)] sm:text-3xl">
              把“高压学习页”变成“疗愈生活页”，
              <br />
              让每次打开都愿意停留。
            </p>
          </div>
        </section>

        <section className="bg-[var(--section-bg)] px-5 py-20 sm:px-8" id="showcase">
          <div className="mx-auto w-full max-w-6xl">
            <SectionTitle
              description="通过内容卡片展示真实场景，把品牌语气、操作节奏和视觉风格统一在一套落地页面中。"
              eyebrow="Showcase"
              title="真实生活化的内容展示"
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {showcaseCards.map((card) => (
                <article className="rounded-[1.75rem] bg-[var(--card-bg)] p-6 shadow-soft-card" key={card.title}>
                  <p className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-strong)]">
                    {card.badge}
                  </p>
                  <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--page-bg)] px-5 py-20 sm:px-8" id="stories">
          <div className="mx-auto w-full max-w-6xl">
            <SectionTitle
              description="真实用户反馈强化“治愈、清新、克制高级”的品牌感知。"
              eyebrow="Testimonials"
              title="来自用户的温和回声"
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {testimonials.map((item) => (
                <blockquote
                  className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-soft-card"
                  key={item.author}
                >
                  <p className="text-lg leading-8 text-[var(--text-secondary)]">“{item.quote}”</p>
                  <footer className="mt-6">
                    <p className="text-base font-semibold text-[var(--text-primary)]">{item.author}</p>
                    <p className="text-sm text-[var(--text-muted)]">{item.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--section-bg)] px-5 py-20 sm:px-8" id="final">
          <div className="mx-auto w-full max-w-4xl rounded-[2.2rem] bg-[var(--brand-strong)] px-6 py-14 text-center text-[var(--text-on-brand)] shadow-[0_28px_48px_-24px_rgba(47,104,79,0.85)] sm:px-10">
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">准备好切换到更温柔的主页了吗？</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[color:rgba(255,255,255,0.9)]">
              现在就使用这套柔和视觉系统，把你的产品首页升级成 Calm, Fresh, Premium 的品牌第一印象。
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                className="inline-flex items-center justify-center rounded-full bg-[var(--card-bg)] px-6 py-3 text-sm font-semibold text-[var(--brand-strong)] transition hover:bg-[var(--section-bg)]"
                href="#"
              >
                立即开始
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.75)] px-6 py-3 text-sm font-semibold text-[var(--text-on-brand)] transition hover:bg-[color:rgba(255,255,255,0.12)]"
                href="#features"
              >
                了解细节
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--page-bg)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-[var(--text-muted)] sm:flex-row sm:px-8">
          <p>© {new Date().getFullYear()} Soft Studio. Designed for calm focus.</p>
          <div className="flex items-center gap-5">
            <a className="hover:text-[var(--brand-strong)]" href="#features">
              Features
            </a>
            <a className="hover:text-[var(--brand-strong)]" href="#showcase">
              Showcase
            </a>
            <a className="hover:text-[var(--brand-strong)]" href="#final">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;
