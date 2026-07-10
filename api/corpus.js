// corpus.js
// Indexed knowledge for The Map's concept-test assistant.
// Chunked into retrievable sections. Each section is self-contained so it can be
// injected alone without losing meaning. Keep sections under ~450 words: the
// Groq free tier bills tokens per day, so context width is the scarce resource.

const SECTIONS = [
  {
    id: "who",
    title: "Who built this, and why",
    keys: "mridul malani creator author student hec paris eis exa background developer credentials scholar consultant",
    text: `The Map was built by Mridul Malani, a Master in Management student at HEC Paris (M1 complete) and a Merit Excellence Scholar, who also works in strategy and consulting at EXA Innovation Studio. He is based near Paris. His professional trajectory is sell-side M&A moving into buy-side private equity.

This is a student research project and a concept test. It is not a company, not a funded startup, and not a live product. Nobody is selling anything. There is no directory of Station F residents behind the demo, and the people and startups shown in the search reveal are invented.

The point of the exercise is to find out whether the idea deserves to exist before anyone builds it. Mridul commissioned adversarial analysis of his own concept first, and the research came back with serious problems, which are documented honestly in this assistant rather than hidden. If you are wondering why a concept test bothers to argue against itself: because a test that cannot fail teaches you nothing.`
  },
  {
    id: "notgoogleform",
    title: "Why this is not a Google Form",
    keys: "google form why not survey typeform different point of this chatbot rag purpose why does this exist why bother",
    text: `A Google Form collects answers. It cannot show you the idea, and it cannot answer you back.

Three things separate this from a form. First, the flow is diagnostic before it is persuasive: it asks what you actually did the last time you needed a specialist for a small job, before it shows you the concept. That ordering exists so your answers are not coached by the pitch. Second, the reveal renders the concept using the skill you personally named, so you react to your own situation rather than an abstraction. Third, this assistant is grounded in a real research dossier covering French labour law, demand and supply evidence, and the failure record of comparable systems. You can interrogate the reasoning, challenge it, and see where the evidence runs out.

When this assistant does not know something, it says so and logs the question, which becomes a record of what the research failed to anticipate. That record is arguably the most valuable output of the whole exercise. A form gives you a spreadsheet. This gives you an argument you can attack.`
  },
  {
    id: "concept",
    title: "What The Map actually is",
    keys: "concept idea product skills consult consultation advice guidance knowledge exchange pooling conversation unit ai claude in-house premise pitch summary overview explain",
    text: `The Map is a proposed live skills map of a startup ecosystem, tested at Station F in Paris, where roughly 1,000 startups sit under one roof.

The premise: somewhere in that building is the person who already solved the problem now sitting on your desk. Not to hire, to ask. You had no way to know they existed and no way to reach them, so you hired an external freelancer, asked a favour, muddled through with AI, did it badly yourself, or dropped it.

The unit of exchange is a conversation, not an employee. The concept is consultation, not staffing. You type a skill, see who on campus has it, and reach the person through their founder, who approves everything. Consent comes first, always. What you get is twenty minutes of hard-won judgement, the steer that stops you building the wrong thing. Then today's tools, Claude and the rest, do the execution in house. For most small jobs a short consult plus AI now beats a fifteen-hour freelance contract.

Knowledge exchange is the primary loop. A secondary path lets an employee in a genuine off-season pick up a small, basic task, because businesses are cyclical and real downtime exists, but that is the exception, not the pitch. Framing it this way solves two problems at once: the founder wasting money on freelancers for jobs they could do in house, and the team member whose expertise nobody outside their own company can see. It is a pooling of skill, not a discount on the freelance bill.

The heavier idea of lawful inter-company staff lending is a possible future extension, not the starting point. The research is blunt about why. See the sections on the three versions, the off-season exception, and French law.`
  },
  {
    id: "versions",
    title: "The three versions, V1, V2, V3",
    keys: "v1 v2 v3 versions which version compliance rails fractional network talent graph consultation consult advice conversation ai status independent recommendation what should you build",
    text: `Three versions were considered. The concept now IS the third, not one option among three.

V1, compliance rails: an employer-paid SaaS that handles the paperwork for lawful, at-cost staff lending. Legal, but almost certainly too heavy for the small urgent tasks that motivate the whole idea. It is explicitly rejected as a starting point.

V2, a fractional network of alumni and moonlighters, monetised with a take-rate. Charging a commission on lending employed staff between companies is a criminal offence in France, so a take-rate is lawful only where the person contracts in their own name as an independent and invoices personally. The moment their employer bills for their time, it is the offence again. Strip the labour lending out and it is a freelancer marketplace competing with Malt and Comet without the "colleague at the next desk" advantage.

V3, the concept as it now stands: a consultation and knowledge-exchange layer. Search a skill, find who knows it, ask them. No employee is made available and no labour moves, so Article L8241 does not engage at all. You get the steer, then execute in house with AI. Two upgrades sharpen this beyond the original research. First, framing the supply side as expertise worth consulting, rather than spare hours to lend, inverts the incentive: being the person others come to is status, not an admission of idle staff. Second, AI has collapsed execution, so the scarce input is judgement, and judgement is what a twenty-minute conversation delivers.

The evidence supports V3 with high confidence. The strongest positive precedent, Y Combinator's Bookface, works precisely because it surfaces expertise without ever transferring labour. That is the consultation posture exactly. The off-season path where an individual takes a small paid task is a narrow, secondary exception, lawful only when that person contracts independently. See the moonlight section.`
  },
  {
    id: "law-prohibition",
    title: "French law: the criminal prohibition",
    keys: "illegal law legal france criminal l8241-1 marchandage penalty prison fine prohibited take rate commission profit lending labour",
    text: `Article L8241-1 of the French Code du travail provides that any for-profit operation whose exclusive object is the lending of labour is prohibited. This is the constraint that shapes everything.

Penalties for illicit labour lending: two years imprisonment and a 30,000 euro fine for a natural person, rising to 150,000 euros for a company, with complementary penalties including dissolution, exclusion from public contracts, and closure of establishments. Aggravated forms reach five years and 75,000 euros, and ten years and 100,000 euros where committed by an organised group. The related offence of marchandage (Article L8231-1) carries the same penalties and is distinguished by prejudice caused to the employee.

Courts apply a bundle-of-indicators test: whether a genuine distinct service is provided rather than just personnel, whose equipment is used, who holds the power of direction over the worker, and how billing is structured. Hourly billing tends to indicate illicit lending. Fixed-price billing for a defined deliverable indicates a genuine service contract.

The practical consequence: a platform taking a commission on borrowing a colleague is committing a criminal offence. Only licensed interim agencies, entreprises de travail a temps partage, and portage salarial companies may lawfully take a fee on labour supply, and each requires becoming that regulated entity.

Confidence: HIGH. This is drawn from the statute itself via Legifrance.`
  },
  {
    id: "law-lawful",
    title: "French law: the lawful route, and why it is too heavy",
    keys: "l8241-2 lawful route cost paperwork convention avenant cse consent overhead friction admin bureaucracy forms sign approval process lend lending staff employee",
    text: `Article L8241-2 permits non-profit inter-company lending under three cumulative conditions: the employee's consent; a convention de mise a disposition between the two companies specifying duration, the employee's identity and qualification, and how salaries and charges will be billed; and an avenant to the employment contract, signed by the employee, specifying the work, hours, and place.

Billing may cover only salaries paid, related social charges, and reimbursed professional expenses. No margin. Any billing above real cost makes the operation lucrative and therefore illicit.

Further obligations: the employment contract is neither broken nor suspended; the employee keeps all benefits and returns to the same or an equivalent post with no career penalty; refusal can never be sanctioned; and the works council (CSE) of both the lending and the receiving company must be informed and consulted beforehand.

Now count what a twelve-hour task requires: founder approval at both firms, a signed convention, a signed avenant, prior CSE consultation twice over, and an insurance check. The transaction cost plausibly exceeds the value of the work. This, and not demand, is the binding constraint on the whole labour-flow model. It is the single most important practical objection to V1 and V2.

Confidence: HIGH on the legal structure, and an informed estimate on the liquidity conclusion.`
  },
  {
    id: "law-carveout",
    title: "The large-company carve-out and groupements d'employeurs",
    keys: "l8241-3 carve out large company 5000 employees decree groupement employeurs GE shared employment corporate partner",
    text: `Article L8241-3, as modified by the law of 15 April 2024, allows a company or group of at least 5,000 employees to make staff available to a young company under eight years old, an SME under 250 employees, or an eligible non-profit. The operation is deemed non-lucrative even if billed below salary cost or at zero. Maximum duration three years. Purposes: improving workforce qualification, favouring professional transitions, or building a partnership.

Important caveat: the article requires an implementing decree (decret en Conseil d'Etat). It could not be confirmed from primary sources whether that decree has been published for the April 2024 version. This must be checked with DREETS or a labour lawyer before anyone relies on the carve-out. That gap is a genuine unknown, not a detail.

Groupements d'employeurs (Article L1253-1) are the proven French institution for shared employment. France has roughly 5,000 of them, about 4,000 agricultural, employing around 15,000 people on permanent contracts, 98 percent structured as associations, averaging 58 members. They work, but they are heavy: a GE creates a legal entity that becomes the employer, and the model suits recurring shared part-time roles, such as an accountant split across several SMEs, rather than one-off urgent tasks.`
  },
  {
    id: "supply",
    title: "The supply side, and how the reframe answers it",
    keys: "supply weakness talent hoarding slack stigma adverse selection lemons peacock best person managers poaching founders willing capacity spare idle hoard release status consultation reciprocity incentive",
    text: `Supply was the concept's greatest weakness under the old framing, and the reframe is a direct answer to it. Worth being blunt about both.

The old problem. Talent hoarding is the default. LinkedIn's Global Talent Trends 2020 found 70 percent of talent-acquisition professionals citing reluctant managers as a barrier to internal mobility. Gartner found more than half of supervisors admit to hoarding talent. Deloitte found 46 percent of managers actively resist internal mobility. Ingrid Haegele's study of a German firm's internal labour market found that temporarily reducing hoarding raised promotion applications by 123 percent, meaning managers had been suppressing that mobility. On top of that, slack stigma: on an investor-observed campus, admitting a team member has spare hours signals overhiring or weak product-market fit to your board and the firm two desks away. And adverse selection: if firms lend at all, they lend their least critical people, degrading the pool. That is the classic lemons dynamic.

Why consultation changes the picture. Every one of those objections attaches to lending labour and to advertising spare capacity. Consultation does neither. You are not offering idle hours, you are offering expertise, and being the team others consult is a status gain, not a confession of overhiring. Because answering is a display of competence, firms put their best person forward, not their most idle, so the adverse-selection lemons dynamic inverts into a peacock one. Nobody hoards the right to answer a question the way they hoard a person's calendar. The supply you need is minutes of judgement, not seconded staff, which is far cheaper to give and far less embarrassing to make visible.

What still has to be earned. Reciprocity is not automatic: people give time when they expect the norm to be returned and when defecting carries reputational cost, which is why the design keeps consent, approval, and individual control of visibility. And advising a direct competitor two desks away stays genuinely sensitive, consultation or not. The reframe turns the supply side from probably-fatal into plausibly-workable. It does not make it free.`
  },
  {
    id: "demand",
    title: "The demand side, and what is missing",
    keys: "demand evidence freelancers malt comet cost day rate small tasks unmet need market size how big is the problem",
    text: `The demand case is reasonable but largely circumstantial, and the best market data comes from vendors with an interest in the answer.

The structural argument: the fixed cost of matching, meaning search, vetting, scoping and contracting, exceeds the value of a small task. So small tasks are underserved by freelance marketplaces by construction. Malt and BCG report 1.2 million freelances in France in 2024, 55 percent in Ile-de-France. Average day rates run 471 euros overall, 492 in tech and data, 394 in design. Malt applies a day-rate floor of 125 euros and commissions run roughly 10 to 15 percent. Those economics make a genuinely small task uneconomic to route through a marketplace. That gap is the white space The Map aims at, and AI widens it: once execution is cheap, the unmet need on a small task is judgement, not labour.

The expertise-location problem is well documented. Skills inventories and corporate directories have existed since the 1990s precisely because finding the right expert is hard even inside one organisation, let alone across a thousand co-located firms.

The honest gap: there is no public data quantifying what fraction of Station F residents have unmet sub-twenty-hour specialist needs, how often, or what it costs them when a task is dropped. That number does not exist. It has to be generated. Generating it is exactly what this concept test is for, which is why your answers matter more than any citation here.`
  },
  {
    id: "whyai",
    title: "The economics: cheap execution, dear judgement",
    keys: "ai claude chatgpt llm gpt tools automation execution judgement judgment taste expertise value expert hour cheap why now timing marginal make buy in-house",
    text: `The economic claim under the reframe is specific. The cost of execution has fallen sharply, while the cost of good judgement has not. So the marginal value of an expert hour has risen, not fallen.

Follow it through. When drafting, coding, formatting, and first-pass research were the expensive parts of a small task, you paid a freelancer for hours of doing. Those hours are now cheap. What stays scarce is knowing which approach will not trap you in six months, where the landmines are, and whether you are even solving the right problem. That is judgement, and it does not compress the way execution has. Someone who has shipped the exact thing you are attempting can save you a week of wrong turns in twenty minutes.

This is why the unit of exchange is a conversation. You are not outsourcing the task, you are buying the judgement that makes doing it yourself fast and safe. The person you consult supplies direction; you supply the execution, cheaply. The claim is not that tools do your work for you. The claim is that the balance of value has shifted from hours toward judgement, and a consultation is the most direct way to buy judgement.

If execution keeps getting cheaper, this holds harder, not softer. The scarcer good is the twenty minutes with someone who already knows.`
  },
  {
    id: "moonlight",
    title: "The off-season exception, and its one hard condition",
    keys: "moonlight moonlighting off-season side task freelance employee independent auto-entrepreneur own name invoice personally loyalty loyaute exclusivity working time cap cyclical downtime secondary paid task second layer",
    text: `Knowledge exchange is the engine. There is a secondary path, kept but demoted: businesses are cyclical, so employees do have genuine off-season hours, and someone with real downtime may take on a small task directly. This is the exception, never the pitch.

It is legally safe only under one hard condition: the employee contracts in their own name as an independent, for example as an auto-entrepreneur, and invoices personally. If their employer invoices for their time, that is lending labour for profit again, the criminal offence in the prohibition section. The platform must never imply that an employer lends or bills for staff. The individual, acting for themselves, is the only lawful supplier of paid hours here.

Even then the employee has their own constraints to respect. The obligation de loyaute binds every employee in France: they may not compete with their employer or damage its interests, and side work during paid leave or sick leave is a classic breach. Many contracts add an exclusivity clause, which can restrict outside work, though a full exclusivity clause must be justified and proportionate to be enforceable. And working-time limits apply across all activities combined: broadly a 10-hour daily cap and a 48-hour weekly cap, so a full-time employee has little lawful room for substantial paid side work in a busy week.

The takeaway: the paid-task layer is real, and it is narrow. Treat it as a bounded add-on to the consultation core, not the business.`
  },
  {
    id: "precedent",
    title: "What has failed before, and why",
    keys: "precedent failed failure similar startups companies tried before bookface roleshare shiftgig yoss wework timebank shukko marketplace gloat history examples happened",
    text: `The failure record of this category is the most useful evidence for anyone assessing the idea.

Cross-company talent sharing has high mortality. RoleShare, a UK job-sharing marketplace backed by Techstars and piloted with JP Morgan and BP, closed in 2023; The Guardian reported that despite two thirds of employees working flexibly, only 1 percent were job-sharing, a matching failure. Shiftgig cut a third of its staff, exited direct staffing, and shut its app in 2021. Yoss, backed by Adecco and Microsoft, pivoted away from its French freelance marketplace. The COVID-era French staff-sharing surge was enabled by temporary derogations that expired on 30 September 2021, and no dataset shows durable persistence afterwards.

Internal talent marketplaces such as Gloat and Fuel50 operate inside a single company that can mandate participation, and they still fight cold-start problems and manager resistance. Critically, every favourable liquidity number traces back to a vendor or a vendor-sponsored study. Independent verification does not exist. Treat the marketing numbers with suspicion.

Time banks and hour-swap systems reliably collapse, defeated by the double coincidence of wants, credit imbalance, and the absence of a price signal. Japan's shukko secondment system does work at scale, but it depends on keiretsu: decades-deep, equity-linked corporate groups with multi-year postings. That is the opposite of a spot market among strangers.

The exception is Y Combinator's Bookface, and it is instructive. It works because of severe selection, a real trust fabric, reciprocity norms, and reputational sanction for defecting. And crucially, no labour ever transfers. Founders answer each other's questions and make introductions. Nobody is lent. That is the consultation posture, advice and introductions with no labour transfer, and it is why the concept now leads with it.`
  },
  {
    id: "falsify",
    title: "What would prove this wrong",
    keys: "falsify proof evidence test metrics thresholds how would you know success failure what would change your mind",
    text: `A thesis that cannot fail is worthless, so here are the numbers that would settle it.

For V3, the consultation version: if more than roughly 40 percent of resident startups create and maintain a skills profile over a three-month pilot, the profile-decay objection weakens materially. Below about 15 percent, the decay failure mode is winning and the idea is in trouble. If more than 30 percent of searches produce an introduction or an answer within 48 hours, the expertise-location value is real. If founders who were consulted come back to consult others, reciprocity is taking hold. If profiles are still fresh at six months without anyone being paid to maintain them, the incentive design works.

For V1, the labour-flow version, the evidence that would reverse the recommendation: founders actually completing the convention, the avenant, and the CSE consultation for sub-twenty-hour tasks at a rate producing recurring liquidity. If that happens, the paperwork-is-fatal thesis is falsified. Equally, if founders say they would lend their best people rather than only their idle ones, the adverse-selection prediction fails and the supply thesis improves.

Those thresholds are informed estimates, not measured constants. The concept test you just completed is designed to move exactly these metrics.`
  },
  {
    id: "privacy",
    title: "Privacy, data, and what happens to your answers",
    keys: "privacy data anonymous gdpr rgpd what happens to my answers who sees this email tracking stored",
    text: `Your answers are anonymous by default. No name is collected. Email is optional and only requested at the very end, purely so you can see what the concept becomes. Responses go to a private spreadsheet, are used to decide whether this idea deserves to exist, and are not sold, shared, or used to market anything to you.

Questions asked here are logged, including the ones this assistant cannot answer, because the gaps in the research are as informative as the findings.

On the broader concept: if a real skills directory were ever built, it would be personal-data processing under the RGPD. Employee consent in an employment context is generally not considered freely given, because of the power imbalance between employer and employee, so a lawful basis would more likely rest on legitimate interest with a documented balancing test, plus prior information and works-council consultation. Availability data, meaning who has spare hours, is arguably sensitive in labour-relations terms. Employee-published profiles are cleaner than employer-declared availability, which is one more reason the recommended design puts the individual, not the employer, in control of what is visible.`
  },
  {
    id: "stationf",
    title: "Why Station F, and why it might not work there either",
    keys: "stationf campus density trust selection substrate suitable venue location paris building roof",
    text: `Station F is an unusually favourable substrate. It houses roughly 1,000 startups, admission rates run in the 6 to 9 percent range which produces real selection effects, there is a single trusted operator, and everyone is physically co-located. The marketplace literature is consistent that constraining scope to a single dense community is a precondition for reaching liquidity, and Station F provides exactly that constraint. Y Combinator's Bookface shows what selection plus trust can produce.

The counterargument is equally serious. Co-located startups may be competitors, which turns sharing staff into a confidentiality and IP problem. A campus full of investors watching makes admitting spare capacity costly. And no shared employer exists that can mandate participation the way a single corporation can with an internal talent marketplace, so the concept faces the same cold-start and hoarding mechanisms with strictly less leverage.

So Station F is the best place to try this, and trying it may still fail. Both things are true.`
  }
];

module.exports = { SECTIONS };
