| Principle | Decision | Reason | Code Implication |
| :-: | :-: | :-: | :-: |
| Deterministic first | Phenotype assignment and severity are rule-based. | This is behavioral-health-adjacent and should be auditable. | Do not use live AI as source of truth for scoring. |
| Hybrid scoring | Use weighted phenotype scores plus hard rules. | Human behavior blends, but some patterns need overrides. | Run point scoring, then gates, hard rules, and tie-breakers. |
| Severity is separate | Phenotype score is fit. Severity score is cost and control. | Arousal, identity, belonging, and gaming can be adaptive. | Never infer severity from content category alone. |
| No diagnosis language | Output loops, pulls, and patterns, not disorders. | Avoid over-pathologizing normal behavior. | Copy layer must follow HR\_LANGUAGE\_001. |
| AI optional | AI can warm the result copy after scoring. | Keeps soul-read quality without losing audit trail. | AI receives only output contract and approved library copy. |

| Source Anchors | URLs | Purpose | Notes |
| :-: | :-: | :-: | :-: |
| Research and clinical guardrails | https://pubmed.ncbi.nlm.nih.gov/31247240/ https://www.who.int/news-room/questions-and-answers/item/addictive-behaviours-gaming-disorder https://www.psychiatry.org/patients-families/gambling-disorder/what-is-gambling-disorder https://pmc.ncbi.nlm.nih.gov/articles/PMC9295232/ https://www.aap.org/en/patient-care/media-and-children/center-of-excellence-on-social-media-and-youth-mental-health/qa-portal/qa-portal-library/qa-portal-library-questions/the-use-of-addiction-language-around-social-media-usage/ | Supports I-PACE framing, caution around addiction language, and higher-confidence gambling/gaming handling. | Keep these in source notes for future validation. |

| Step | Name | Implementation Detail | Why It Exists |
| :-: | :-: | :-: | :-: |
| 1 | Normalize answers into tags | Convert every selected answer into signal\_type:tag pairs. Preserve anchor feature rank if available. | Code should not reason from raw text. |
| 2 | Score phenotype fit | For each phenotype, sum all matching rows from Rule Weights. Apply anchor feature multipliers if feature rank exists. | Flexible patterns can accumulate evidence. |
| 3 | Apply eligibility gates | Use Eligibility Gates to block, cap, or mark adaptive patterns before final ranking. | Prevents broad hooks from over-assigning the wrong result. |
| 4 | Apply hard rules | Run Hard Rules in priority order. Hard rules can force phenotype, floor severity, cap severity, or bypass normal result flow. | High-risk and non-pathologizing cases should not depend on points alone. |
| 5 | Resolve tie-breakers | If top scores are close, use Tie Breakers. If still close, return mixed primary/secondary with lower confidence. | Human behavior blends. The product should not pretend certainty. |
| 6 | Calculate severity separately | Use Severity Rules. Do not infer severity from phenotype type or content category alone. | Phenotype is kind of loop. Severity is cost/control. |
| 7 | Produce output contract | Return structured JSON-like fields in Output Contract, then render user-facing copy from the phenotype library. | Website code gets stable data, user gets warm result. |
| 8 | Optional AI layer | AI can paraphrase from structured output and approved library copy. It cannot assign or diagnose. | Keeps warmth without losing auditability. |

| Signal Type | Tag ID | Display Name |
| :-: | :-: | :-: |
| hook | endless\_feed | The Endless Feed |
| hook | tethered\_check | The Tethered Check |
| hook | tethered\_social | The Tethered Social |
| hook | mirror | The Mirror |
| hook | climb | The Climb |
| hook | belonging | The Belonging |
| hook | parasocial\_bond | The Parasocial Bond |
| hook | rabbit\_hole | The Rabbit Hole |
| hook | activation | The Activation |
| hook | companion | The Companion |
| hook | reward\_chase | The Reward Chase |
| hook | zone\_out | The Zone-Out |
| hook | arousal\_pull | The Arousal Pull |
| hook | second\_self | The Second Self |
| job | stimulate | Stimulate me |
| job | soothe | Soothe me |
| job | reassure | Reassure me |
| job | validate | Validate me |
| job | compare | Compare me |
| job | connect | Connect me |
| job | empower | Empower me |
| entry\_point | night\_regulation | Night Regulation |
| entry\_point | morning\_check\_in | Morning Check-In |
| entry\_point | gap\_filling | Gap Filling |
| entry\_point | task\_avoidance | Task Avoidance |
| entry\_point | stress\_relief | Stress Relief |
| entry\_point | alone\_disconnected | Alone / Disconnected |
| entry\_point | under\_stimulated | Under-Stimulated |
| entry\_point | anytime\_no\_pattern | Anytime / No Pattern |
| entry\_point | not\_problem | Not a Problem |
| loop\_shape | quick\_check | Quick-Check Loop |
| loop\_shape | time\_sink\_binge | Time-Sink / Binge Loop |
| loop\_shape | autopilot | Autopilot Loop |
| loop\_shape | waiting\_refresh | Waiting / Refresh Loop |
| loop\_shape | completion | Completion Loop |
| loop\_shape | background | Background Loop |
| loop\_shape | social\_participation | Social Participation Loop |
| loop\_shape | not\_sure | Not Sure |
| aftertaste | calmer\_regulated | Calmer / Regulated |
| aftertaste | connected | Connected |
| aftertaste | entertained | Entertained |
| aftertaste | numb | Numb |
| aftertaste | guilty\_ashamed | Guilty / Ashamed |
| aftertaste | worse\_self\_body | Worse About Self / Body |
| aftertaste | more\_anxious | More Anxious |
| aftertaste | more\_lonely | More Lonely |
| aftertaste | tired | Tired |
| aftertaste | behind\_panicked | Behind / Panicked |
| aftertaste | no\_different | No Different |
| cost\_domain | sleep | Sleep |
| cost\_domain | work\_school\_responsibilities | School / Work / Responsibilities |
| cost\_domain | focus\_attention | Focus and Attention |
| cost\_domain | mood\_anxiety | Mood or Anxiety |
| cost\_domain | self\_body\_image | Self / Body Image |
| cost\_domain | friendships\_dating\_social | Friendships / Dating / Social Life |
| cost\_domain | home\_family\_conflict | Home / Family Conflict |
| cost\_domain | money | Money |
| cost\_domain | none\_meaningful | Nowhere Meaningful |
| severity\_marker | loss\_control | Loss of Control |
| severity\_marker | failed\_cutback | Failed Cutback |
| severity\_marker | time\_creep | Time Creep |
| severity\_marker | withdrawal\_restlessness | Withdrawal / Restlessness |
| severity\_marker | mental\_pull | Mental Pull |
| severity\_marker | concealment | Concealment |
| severity\_marker | interference\_harm | Interference / Harm |
| severity\_marker | compensation\_stage | Compensation Stage |
| severity\_marker | none | None |
| tie\_breaker | night\_avoid\_head | Night Avoid Head |
| tie\_breaker | night\_only\_time\_mine | Only Time Mine |
| tie\_breaker | hand\_went\_there | Hand Went There |
| tie\_breaker | effort\_turns\_progress | Effort Turns Progress |
| tie\_breaker | preparing\_becomes\_thing | Preparing Becomes Thing |
| tie\_breaker | see\_if\_changed | See If Changed |
| tie\_breaker | read\_enough\_safe | Read Enough To Feel Safe |
| tie\_breaker | checking\_reaction\_to\_me | Checking Reaction To Me |
| tie\_breaker | see\_where\_i\_stand | See Where I Stand |
| tie\_breaker | failing\_someone | Failing Someone |
| tie\_breaker | these\_are\_my\_people | These Are My People |
| tie\_breaker | always\_answers | Always Answers |
| tie\_breaker | voice\_part\_of\_day | Voice Part Of Day |
| tie\_breaker | angry\_feels\_awake | Angry Feels Awake |
| tie\_breaker | next\_one\_could\_be\_one | Next One Could Be The One |
| tie\_breaker | private\_changes\_channel | Private Changes Channel |
| tie\_breaker | real\_life\_no\_room | Real Life No Room |
| platform\_feature | betting\_trading\_gambling | Betting / Trading / Gambling |
| platform\_feature | adult\_or\_intimacy\_content | Adult / Intimacy Content |
| platform\_feature | ai\_chatbot\_support | AI / Chatbot Emotional Support |
| platform\_feature | gaming\_ranked\_progress | Gaming / Ranked / Progress |
| platform\_feature | creator\_streamer\_media | Creator / Streamer / Personality |
| platform\_feature | community\_server\_group | Community / Server / Group |
| platform\_feature | posting\_metrics | Posting / Metrics / Matches |
| platform\_feature | news\_health\_search | News / Health / Decision Search |
| platform\_feature | shopping\_deals\_marketplace | Shopping / Deals / Marketplace |

| Phenotype ID | Phenotype Name | Short Result Label |
| :-: | :-: | :-: |
| night\_regulator | The Night Regulator | Late-night off-switch loop |
| time\_reclaimer | The Time Reclaimer | Stolen personal-time loop |
| autopilot\_drifter | The Autopilot Drifter | Automatic gap-filling loop |
| competence\_refuge | The Competence Refuge | Digital mastery escape |
| optimizer\_spiral | The Optimizer Spiral | Preparation instead of action |
| reassurance\_checker | The Reassurance Checker | Short anxious check loop |
| vigilant\_scanner | The Vigilant Scanner | Certainty-seeking search loop |
| validation\_monitor | The Validation Monitor | Social signal checking |
| comparison\_spiral | The Comparison Spiral | Self-ranking feed loop |
| always\_on\_responder | The Always-On Responder | Availability and reply-pressure loop |
| online\_home | The Online Home | Primary belonging world |
| always\_there\_confidant | The Always-There Confidant | One-to-one digital confidant |
| creator\_anchor | The Creator Anchor | Familiar-voice comfort loop |
| activation\_loop | The Activation Loop | Outrage and intensity loop |
| reward\_chaser | The Reward Chaser | Uncertain-win loop |
| arousal\_regulator | The Arousal Regulator | Private arousal-regulation loop |
| second\_self | The Second Self | Identity immersion loop |

| Phenotype ID | Phenotype Name | Signal Type | Tag ID | Weight | Notes |
| :-: | :-: | :-: | :-: | :-: | :-: |
| night\_regulator | The Night Regulator | hook | zone\_out | 3 | Content is functioning as a pre-sleep off-switch. |
| night\_regulator | The Night Regulator | hook | endless\_feed | 3 | Content is functioning as a pre-sleep off-switch. |
| night\_regulator | The Night Regulator | hook | companion | 1.5 | Can be sound, company, or familiar presence at night. |
| night\_regulator | The Night Regulator | hook | parasocial\_bond | 1.5 | Can be sound, company, or familiar presence at night. |
| night\_regulator | The Night Regulator | job | soothe | 2.5 |  |
| night\_regulator | The Night Regulator | job | connect | 1 |  |
| night\_regulator | The Night Regulator | entry\_point | night\_regulation | 3 |  |
| night\_regulator | The Night Regulator | entry\_point | stress\_relief | 1 |  |
| night\_regulator | The Night Regulator | entry\_point | alone\_disconnected | 1 |  |
| night\_regulator | The Night Regulator | loop\_shape | time\_sink\_binge | 2 |  |
| night\_regulator | The Night Regulator | loop\_shape | background | 1 |  |
| night\_regulator | The Night Regulator | loop\_shape | completion | 1 |  |
| night\_regulator | The Night Regulator | aftertaste | tired | 1.5 |  |
| night\_regulator | The Night Regulator | aftertaste | numb | 1 |  |
| night\_regulator | The Night Regulator | aftertaste | more\_anxious | 1 |  |
| night\_regulator | The Night Regulator | cost\_domain | sleep | 2.5 |  |
| night\_regulator | The Night Regulator | cost\_domain | mood\_anxiety | 1 |  |
| night\_regulator | The Night Regulator | cost\_domain | focus\_attention | 1 |  |
| night\_regulator | The Night Regulator | tie\_breaker | night\_avoid\_head | 4 |  |
| time\_reclaimer | The Time Reclaimer | hook | endless\_feed | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | hook | zone\_out | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | hook | second\_self | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | hook | parasocial\_bond | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | hook | reward\_chase | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | job | soothe | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | job | stimulate | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | job | empower | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | entry\_point | night\_regulation | 3 |  |
| time\_reclaimer | The Time Reclaimer | entry\_point | stress\_relief | 1 |  |
| time\_reclaimer | The Time Reclaimer | entry\_point | task\_avoidance | 1 |  |
| time\_reclaimer | The Time Reclaimer | loop\_shape | time\_sink\_binge | 2 |  |
| time\_reclaimer | The Time Reclaimer | loop\_shape | background | 1 |  |
| time\_reclaimer | The Time Reclaimer | loop\_shape | social\_participation | 1 |  |
| time\_reclaimer | The Time Reclaimer | aftertaste | tired | 1.5 |  |
| time\_reclaimer | The Time Reclaimer | cost\_domain | sleep | 2 |  |
| time\_reclaimer | The Time Reclaimer | cost\_domain | work\_school\_responsibilities | 1 |  |
| time\_reclaimer | The Time Reclaimer | cost\_domain | mood\_anxiety | 1 |  |
| time\_reclaimer | The Time Reclaimer | tie\_breaker | night\_only\_time\_mine | 4 |  |
| autopilot\_drifter | The Autopilot Drifter | hook | endless\_feed | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | hook | zone\_out | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | hook | tethered\_check | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | job | soothe | 1.5 |  |
| autopilot\_drifter | The Autopilot Drifter | job | stimulate | 1.5 |  |
| autopilot\_drifter | The Autopilot Drifter | entry\_point | gap\_filling | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | entry\_point | anytime\_no\_pattern | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | entry\_point | under\_stimulated | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | entry\_point | morning\_check\_in | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | loop\_shape | autopilot | 3.5 |  |
| autopilot\_drifter | The Autopilot Drifter | loop\_shape | quick\_check | 1.5 |  |
| autopilot\_drifter | The Autopilot Drifter | loop\_shape | background | 1.5 |  |
| autopilot\_drifter | The Autopilot Drifter | aftertaste | no\_different | 1 |  |
| autopilot\_drifter | The Autopilot Drifter | aftertaste | numb | 1 |  |
| autopilot\_drifter | The Autopilot Drifter | aftertaste | behind\_panicked | 1 |  |
| autopilot\_drifter | The Autopilot Drifter | cost\_domain | focus\_attention | 2 |  |
| autopilot\_drifter | The Autopilot Drifter | cost\_domain | work\_school\_responsibilities | 1 |  |
| autopilot\_drifter | The Autopilot Drifter | cost\_domain | mood\_anxiety | 1 |  |
| autopilot\_drifter | The Autopilot Drifter | tie\_breaker | hand\_went\_there | 4 |  |
| competence\_refuge | The Competence Refuge | hook | climb | 3.5 |  |
| competence\_refuge | The Competence Refuge | hook | reward\_chase | 1 |  |
| competence\_refuge | The Competence Refuge | hook | second\_self | 1 |  |
| competence\_refuge | The Competence Refuge | hook | zone\_out | 1 |  |
| competence\_refuge | The Competence Refuge | job | empower | 3 |  |
| competence\_refuge | The Competence Refuge | job | validate | 1 |  |
| competence\_refuge | The Competence Refuge | job | stimulate | 1 |  |
| competence\_refuge | The Competence Refuge | job | soothe | 1 |  |
| competence\_refuge | The Competence Refuge | entry\_point | task\_avoidance | 2.5 |  |
| competence\_refuge | The Competence Refuge | entry\_point | stress\_relief | 1.5 |  |
| competence\_refuge | The Competence Refuge | entry\_point | under\_stimulated | 1.5 |  |
| competence\_refuge | The Competence Refuge | loop\_shape | completion | 1.5 |  |
| competence\_refuge | The Competence Refuge | loop\_shape | time\_sink\_binge | 1.5 |  |
| competence\_refuge | The Competence Refuge | loop\_shape | social\_participation | 1.5 |  |
| competence\_refuge | The Competence Refuge | aftertaste | behind\_panicked | 1 |  |
| competence\_refuge | The Competence Refuge | aftertaste | guilty\_ashamed | 1 |  |
| competence\_refuge | The Competence Refuge | cost\_domain | work\_school\_responsibilities | 2 |  |
| competence\_refuge | The Competence Refuge | cost\_domain | focus\_attention | 2 |  |
| competence\_refuge | The Competence Refuge | cost\_domain | mood\_anxiety | 1 |  |
| competence\_refuge | The Competence Refuge | cost\_domain | home\_family\_conflict | 1 |  |
| competence\_refuge | The Competence Refuge | platform\_feature | gaming\_ranked\_progress | 1.5 |  |
| competence\_refuge | The Competence Refuge | tie\_breaker | effort\_turns\_progress | 4 |  |
| optimizer\_spiral | The Optimizer Spiral | hook | rabbit\_hole | 3.5 |  |
| optimizer\_spiral | The Optimizer Spiral | hook | companion | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | hook | climb | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | hook | tethered\_check | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | job | empower | 2.5 |  |
| optimizer\_spiral | The Optimizer Spiral | job | reassure | 2.5 |  |
| optimizer\_spiral | The Optimizer Spiral | job | soothe | 1 |  |
| optimizer\_spiral | The Optimizer Spiral | entry\_point | task\_avoidance | 3 |  |
| optimizer\_spiral | The Optimizer Spiral | entry\_point | stress\_relief | 1 |  |
| optimizer\_spiral | The Optimizer Spiral | entry\_point | morning\_check\_in | 1 |  |
| optimizer\_spiral | The Optimizer Spiral | loop\_shape | completion | 3 |  |
| optimizer\_spiral | The Optimizer Spiral | loop\_shape | time\_sink\_binge | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | loop\_shape | waiting\_refresh | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | aftertaste | behind\_panicked | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | aftertaste | more\_anxious | 1.5 |  |
| optimizer\_spiral | The Optimizer Spiral | cost\_domain | work\_school\_responsibilities | 2 |  |
| optimizer\_spiral | The Optimizer Spiral | cost\_domain | focus\_attention | 2 |  |
| optimizer\_spiral | The Optimizer Spiral | cost\_domain | mood\_anxiety | 1 |  |
| optimizer\_spiral | The Optimizer Spiral | platform\_feature | ai\_chatbot\_support | 1 |  |
| optimizer\_spiral | The Optimizer Spiral | platform\_feature | news\_health\_search | 1 |  |
| optimizer\_spiral | The Optimizer Spiral | tie\_breaker | preparing\_becomes\_thing | 4 |  |
| reassurance\_checker | The Reassurance Checker | hook | tethered\_check | 3.5 |  |
| reassurance\_checker | The Reassurance Checker | hook | tethered\_social | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | hook | companion | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | job | reassure | 3 |  |
| reassurance\_checker | The Reassurance Checker | job | validate | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | job | connect | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | entry\_point | morning\_check\_in | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | entry\_point | gap\_filling | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | entry\_point | alone\_disconnected | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | entry\_point | night\_regulation | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | loop\_shape | quick\_check | 3.5 |  |
| reassurance\_checker | The Reassurance Checker | loop\_shape | waiting\_refresh | 2 |  |
| reassurance\_checker | The Reassurance Checker | aftertaste | more\_anxious | 1 |  |
| reassurance\_checker | The Reassurance Checker | aftertaste | tired | 1 |  |
| reassurance\_checker | The Reassurance Checker | aftertaste | no\_different | 1 |  |
| reassurance\_checker | The Reassurance Checker | cost\_domain | focus\_attention | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | cost\_domain | sleep | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | cost\_domain | mood\_anxiety | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | cost\_domain | friendships\_dating\_social | 1.5 |  |
| reassurance\_checker | The Reassurance Checker | tie\_breaker | see\_if\_changed | 4 |  |
| vigilant\_scanner | The Vigilant Scanner | hook | rabbit\_hole | 3.5 |  |
| vigilant\_scanner | The Vigilant Scanner | hook | tethered\_check | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | hook | activation | 0.5 |  |
| vigilant\_scanner | The Vigilant Scanner | job | reassure | 3 |  |
| vigilant\_scanner | The Vigilant Scanner | job | empower | 1 |  |
| vigilant\_scanner | The Vigilant Scanner | entry\_point | stress\_relief | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | entry\_point | under\_stimulated | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | entry\_point | anytime\_no\_pattern | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | loop\_shape | completion | 2.5 |  |
| vigilant\_scanner | The Vigilant Scanner | loop\_shape | waiting\_refresh | 2.5 |  |
| vigilant\_scanner | The Vigilant Scanner | loop\_shape | time\_sink\_binge | 1 |  |
| vigilant\_scanner | The Vigilant Scanner | aftertaste | more\_anxious | 2 |  |
| vigilant\_scanner | The Vigilant Scanner | aftertaste | behind\_panicked | 2 |  |
| vigilant\_scanner | The Vigilant Scanner | cost\_domain | mood\_anxiety | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | cost\_domain | focus\_attention | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | cost\_domain | work\_school\_responsibilities | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | cost\_domain | sleep | 1.5 |  |
| vigilant\_scanner | The Vigilant Scanner | platform\_feature | news\_health\_search | 2 |  |
| vigilant\_scanner | The Vigilant Scanner | tie\_breaker | read\_enough\_safe | 4 |  |
| validation\_monitor | The Validation Monitor | hook | tethered\_check | 2.5 |  |
| validation\_monitor | The Validation Monitor | hook | mirror | 2.5 |  |
| validation\_monitor | The Validation Monitor | hook | climb | 1.5 |  |
| validation\_monitor | The Validation Monitor | hook | tethered\_social | 1.5 |  |
| validation\_monitor | The Validation Monitor | job | validate | 3.5 |  |
| validation\_monitor | The Validation Monitor | job | reassure | 1.5 |  |
| validation\_monitor | The Validation Monitor | job | compare | 1.5 |  |
| validation\_monitor | The Validation Monitor | job | connect | 1.5 |  |
| validation\_monitor | The Validation Monitor | entry\_point | morning\_check\_in | 1.5 |  |
| validation\_monitor | The Validation Monitor | entry\_point | gap\_filling | 1.5 |  |
| validation\_monitor | The Validation Monitor | entry\_point | alone\_disconnected | 1.5 |  |
| validation\_monitor | The Validation Monitor | loop\_shape | waiting\_refresh | 3 |  |
| validation\_monitor | The Validation Monitor | loop\_shape | quick\_check | 2 |  |
| validation\_monitor | The Validation Monitor | aftertaste | worse\_self\_body | 1.5 |  |
| validation\_monitor | The Validation Monitor | aftertaste | more\_anxious | 1.5 |  |
| validation\_monitor | The Validation Monitor | aftertaste | guilty\_ashamed | 1.5 |  |
| validation\_monitor | The Validation Monitor | cost\_domain | mood\_anxiety | 1.5 |  |
| validation\_monitor | The Validation Monitor | cost\_domain | self\_body\_image | 1.5 |  |
| validation\_monitor | The Validation Monitor | cost\_domain | focus\_attention | 1.5 |  |
| validation\_monitor | The Validation Monitor | cost\_domain | friendships\_dating\_social | 1.5 |  |
| validation\_monitor | The Validation Monitor | platform\_feature | posting\_metrics | 2 |  |
| validation\_monitor | The Validation Monitor | tie\_breaker | checking\_reaction\_to\_me | 4 |  |
| comparison\_spiral | The Comparison Spiral | hook | mirror | 3.5 |  |
| comparison\_spiral | The Comparison Spiral | hook | endless\_feed | 1 |  |
| comparison\_spiral | The Comparison Spiral | hook | parasocial\_bond | 1 |  |
| comparison\_spiral | The Comparison Spiral | job | compare | 3.5 |  |
| comparison\_spiral | The Comparison Spiral | job | validate | 2 |  |
| comparison\_spiral | The Comparison Spiral | job | reassure | 1 |  |
| comparison\_spiral | The Comparison Spiral | entry\_point | gap\_filling | 1.5 |  |
| comparison\_spiral | The Comparison Spiral | entry\_point | stress\_relief | 1.5 |  |
| comparison\_spiral | The Comparison Spiral | entry\_point | alone\_disconnected | 1.5 |  |
| comparison\_spiral | The Comparison Spiral | loop\_shape | time\_sink\_binge | 1.5 |  |
| comparison\_spiral | The Comparison Spiral | loop\_shape | autopilot | 1.5 |  |
| comparison\_spiral | The Comparison Spiral | loop\_shape | waiting\_refresh | 1.5 |  |
| comparison\_spiral | The Comparison Spiral | aftertaste | worse\_self\_body | 3 |  |
| comparison\_spiral | The Comparison Spiral | aftertaste | more\_anxious | 1 |  |
| comparison\_spiral | The Comparison Spiral | aftertaste | guilty\_ashamed | 1 |  |
| comparison\_spiral | The Comparison Spiral | cost\_domain | self\_body\_image | 3 |  |
| comparison\_spiral | The Comparison Spiral | cost\_domain | mood\_anxiety | 1 |  |
| comparison\_spiral | The Comparison Spiral | cost\_domain | friendships\_dating\_social | 1 |  |
| comparison\_spiral | The Comparison Spiral | tie\_breaker | see\_where\_i\_stand | 4 |  |
| always\_on\_responder | The Always-On Responder | hook | tethered\_social | 3.5 |  |
| always\_on\_responder | The Always-On Responder | hook | tethered\_check | 2 |  |
| always\_on\_responder | The Always-On Responder | hook | belonging | 1 |  |
| always\_on\_responder | The Always-On Responder | job | connect | 2.5 |  |
| always\_on\_responder | The Always-On Responder | job | reassure | 2.5 |  |
| always\_on\_responder | The Always-On Responder | job | validate | 1 |  |
| always\_on\_responder | The Always-On Responder | entry\_point | morning\_check\_in | 1.5 |  |
| always\_on\_responder | The Always-On Responder | entry\_point | gap\_filling | 1.5 |  |
| always\_on\_responder | The Always-On Responder | entry\_point | alone\_disconnected | 1.5 |  |
| always\_on\_responder | The Always-On Responder | loop\_shape | social\_participation | 3 |  |
| always\_on\_responder | The Always-On Responder | loop\_shape | quick\_check | 2 |  |
| always\_on\_responder | The Always-On Responder | loop\_shape | waiting\_refresh | 2 |  |
| always\_on\_responder | The Always-On Responder | aftertaste | more\_anxious | 1.5 |  |
| always\_on\_responder | The Always-On Responder | aftertaste | tired | 1.5 |  |
| always\_on\_responder | The Always-On Responder | aftertaste | behind\_panicked | 1.5 |  |
| always\_on\_responder | The Always-On Responder | cost\_domain | focus\_attention | 1.5 |  |
| always\_on\_responder | The Always-On Responder | cost\_domain | mood\_anxiety | 1.5 |  |
| always\_on\_responder | The Always-On Responder | cost\_domain | friendships\_dating\_social | 1.5 |  |
| always\_on\_responder | The Always-On Responder | cost\_domain | work\_school\_responsibilities | 1.5 |  |
| always\_on\_responder | The Always-On Responder | cost\_domain | home\_family\_conflict | 1.5 |  |
| always\_on\_responder | The Always-On Responder | tie\_breaker | failing\_someone | 4 |  |
| online\_home | The Online Home | hook | belonging | 3.5 |  |
| online\_home | The Online Home | hook | tethered\_social | 1.5 |  |
| online\_home | The Online Home | hook | companion | 1.5 |  |
| online\_home | The Online Home | hook | parasocial\_bond | 1.5 |  |
| online\_home | The Online Home | job | connect | 3 |  |
| online\_home | The Online Home | job | reassure | 1 |  |
| online\_home | The Online Home | job | validate | 1 |  |
| online\_home | The Online Home | entry\_point | alone\_disconnected | 3 |  |
| online\_home | The Online Home | entry\_point | stress\_relief | 1 |  |
| online\_home | The Online Home | entry\_point | night\_regulation | 1 |  |
| online\_home | The Online Home | loop\_shape | social\_participation | 3 |  |
| online\_home | The Online Home | loop\_shape | time\_sink\_binge | 1.5 |  |
| online\_home | The Online Home | loop\_shape | background | 1.5 |  |
| online\_home | The Online Home | aftertaste | connected | 2 |  |
| online\_home | The Online Home | aftertaste | more\_lonely | 1 |  |
| online\_home | The Online Home | cost\_domain | friendships\_dating\_social | 2.5 |  |
| online\_home | The Online Home | cost\_domain | mood\_anxiety | 1 |  |
| online\_home | The Online Home | cost\_domain | work\_school\_responsibilities | 1 |  |
| online\_home | The Online Home | platform\_feature | community\_server\_group | 2 |  |
| online\_home | The Online Home | tie\_breaker | these\_are\_my\_people | 4 |  |
| always\_there\_confidant | The Always-There Confidant | hook | companion | 3.5 |  |
| always\_there\_confidant | The Always-There Confidant | hook | parasocial\_bond | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | hook | tethered\_check | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | hook | second\_self | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | job | connect | 3 |  |
| always\_there\_confidant | The Always-There Confidant | job | soothe | 2 |  |
| always\_there\_confidant | The Always-There Confidant | job | validate | 1 |  |
| always\_there\_confidant | The Always-There Confidant | job | reassure | 1 |  |
| always\_there\_confidant | The Always-There Confidant | entry\_point | alone\_disconnected | 3 |  |
| always\_there\_confidant | The Always-There Confidant | entry\_point | stress\_relief | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | entry\_point | night\_regulation | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | loop\_shape | social\_participation | 2 |  |
| always\_there\_confidant | The Always-There Confidant | loop\_shape | time\_sink\_binge | 1 |  |
| always\_there\_confidant | The Always-There Confidant | loop\_shape | quick\_check | 1 |  |
| always\_there\_confidant | The Always-There Confidant | aftertaste | connected | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | aftertaste | calmer\_regulated | 1.5 |  |
| always\_there\_confidant | The Always-There Confidant | aftertaste | more\_lonely | 1 |  |
| always\_there\_confidant | The Always-There Confidant | cost\_domain | friendships\_dating\_social | 2 |  |
| always\_there\_confidant | The Always-There Confidant | cost\_domain | mood\_anxiety | 1 |  |
| always\_there\_confidant | The Always-There Confidant | cost\_domain | sleep | 1 |  |
| always\_there\_confidant | The Always-There Confidant | platform\_feature | ai\_chatbot\_support | 2.5 |  |
| always\_there\_confidant | The Always-There Confidant | tie\_breaker | always\_answers | 4 |  |
| creator\_anchor | The Creator Anchor | hook | parasocial\_bond | 3.5 |  |
| creator\_anchor | The Creator Anchor | hook | companion | 2 |  |
| creator\_anchor | The Creator Anchor | hook | belonging | 1 |  |
| creator\_anchor | The Creator Anchor | hook | endless\_feed | 1 |  |
| creator\_anchor | The Creator Anchor | job | connect | 2.5 |  |
| creator\_anchor | The Creator Anchor | job | soothe | 2.5 |  |
| creator\_anchor | The Creator Anchor | job | validate | 1 |  |
| creator\_anchor | The Creator Anchor | entry\_point | alone\_disconnected | 2 |  |
| creator\_anchor | The Creator Anchor | entry\_point | night\_regulation | 1 |  |
| creator\_anchor | The Creator Anchor | entry\_point | stress\_relief | 1 |  |
| creator\_anchor | The Creator Anchor | entry\_point | gap\_filling | 1 |  |
| creator\_anchor | The Creator Anchor | loop\_shape | background | 2 |  |
| creator\_anchor | The Creator Anchor | loop\_shape | time\_sink\_binge | 2 |  |
| creator\_anchor | The Creator Anchor | loop\_shape | social\_participation | 1 |  |
| creator\_anchor | The Creator Anchor | aftertaste | connected | 1.5 |  |
| creator\_anchor | The Creator Anchor | aftertaste | calmer\_regulated | 1.5 |  |
| creator\_anchor | The Creator Anchor | aftertaste | more\_lonely | 1 |  |
| creator\_anchor | The Creator Anchor | cost\_domain | friendships\_dating\_social | 2 |  |
| creator\_anchor | The Creator Anchor | cost\_domain | sleep | 1 |  |
| creator\_anchor | The Creator Anchor | cost\_domain | money | 1 |  |
| creator\_anchor | The Creator Anchor | platform\_feature | creator\_streamer\_media | 2 |  |
| creator\_anchor | The Creator Anchor | tie\_breaker | voice\_part\_of\_day | 4 |  |
| activation\_loop | The Activation Loop | hook | activation | 3.5 |  |
| activation\_loop | The Activation Loop | hook | endless\_feed | 1 |  |
| activation\_loop | The Activation Loop | hook | rabbit\_hole | 1 |  |
| activation\_loop | The Activation Loop | job | stimulate | 3 |  |
| activation\_loop | The Activation Loop | job | validate | 1 |  |
| activation\_loop | The Activation Loop | job | soothe | 1 |  |
| activation\_loop | The Activation Loop | entry\_point | under\_stimulated | 2 |  |
| activation\_loop | The Activation Loop | entry\_point | stress\_relief | 2 |  |
| activation\_loop | The Activation Loop | entry\_point | morning\_check\_in | 1 |  |
| activation\_loop | The Activation Loop | entry\_point | gap\_filling | 1 |  |
| activation\_loop | The Activation Loop | loop\_shape | time\_sink\_binge | 2 |  |
| activation\_loop | The Activation Loop | loop\_shape | social\_participation | 2 |  |
| activation\_loop | The Activation Loop | loop\_shape | waiting\_refresh | 1 |  |
| activation\_loop | The Activation Loop | aftertaste | more\_anxious | 2 |  |
| activation\_loop | The Activation Loop | aftertaste | guilty\_ashamed | 1 |  |
| activation\_loop | The Activation Loop | aftertaste | no\_different | 1 |  |
| activation\_loop | The Activation Loop | cost\_domain | mood\_anxiety | 2 |  |
| activation\_loop | The Activation Loop | cost\_domain | friendships\_dating\_social | 2 |  |
| activation\_loop | The Activation Loop | cost\_domain | focus\_attention | 1 |  |
| activation\_loop | The Activation Loop | cost\_domain | home\_family\_conflict | 1 |  |
| activation\_loop | The Activation Loop | tie\_breaker | angry\_feels\_awake | 4 |  |
| reward\_chaser | The Reward Chaser | hook | reward\_chase | 4 |  |
| reward\_chaser | The Reward Chaser | hook | climb | 1 |  |
| reward\_chaser | The Reward Chaser | hook | tethered\_check | 1 |  |
| reward\_chaser | The Reward Chaser | hook | endless\_feed | 1 |  |
| reward\_chaser | The Reward Chaser | job | stimulate | 2.5 |  |
| reward\_chaser | The Reward Chaser | job | empower | 2.5 |  |
| reward\_chaser | The Reward Chaser | job | validate | 1 |  |
| reward\_chaser | The Reward Chaser | job | reassure | 1 |  |
| reward\_chaser | The Reward Chaser | entry\_point | under\_stimulated | 2 |  |
| reward\_chaser | The Reward Chaser | entry\_point | stress\_relief | 1 |  |
| reward\_chaser | The Reward Chaser | entry\_point | anytime\_no\_pattern | 1 |  |
| reward\_chaser | The Reward Chaser | loop\_shape | waiting\_refresh | 2 |  |
| reward\_chaser | The Reward Chaser | loop\_shape | completion | 2 |  |
| reward\_chaser | The Reward Chaser | loop\_shape | time\_sink\_binge | 2 |  |
| reward\_chaser | The Reward Chaser | loop\_shape | quick\_check | 1 |  |
| reward\_chaser | The Reward Chaser | aftertaste | guilty\_ashamed | 2 |  |
| reward\_chaser | The Reward Chaser | aftertaste | behind\_panicked | 2 |  |
| reward\_chaser | The Reward Chaser | aftertaste | more\_anxious | 1 |  |
| reward\_chaser | The Reward Chaser | cost\_domain | money | 4 |  |
| reward\_chaser | The Reward Chaser | cost\_domain | mood\_anxiety | 1 |  |
| reward\_chaser | The Reward Chaser | cost\_domain | friendships\_dating\_social | 1 |  |
| reward\_chaser | The Reward Chaser | cost\_domain | work\_school\_responsibilities | 1 |  |
| reward\_chaser | The Reward Chaser | cost\_domain | sleep | 1 |  |
| reward\_chaser | The Reward Chaser | platform\_feature | betting\_trading\_gambling | 3 |  |
| reward\_chaser | The Reward Chaser | platform\_feature | shopping\_deals\_marketplace | 3 |  |
| reward\_chaser | The Reward Chaser | tie\_breaker | next\_one\_could\_be\_one | 4 |  |
| arousal\_regulator | The Arousal Regulator | hook | arousal\_pull | 4 |  |
| arousal\_regulator | The Arousal Regulator | hook | companion | 1.5 |  |
| arousal\_regulator | The Arousal Regulator | hook | second\_self | 1.5 |  |
| arousal\_regulator | The Arousal Regulator | hook | parasocial\_bond | 1.5 |  |
| arousal\_regulator | The Arousal Regulator | hook | endless\_feed | 1.5 |  |
| arousal\_regulator | The Arousal Regulator | job | soothe | 2.5 |  |
| arousal\_regulator | The Arousal Regulator | job | stimulate | 2.5 |  |
| arousal\_regulator | The Arousal Regulator | job | validate | 1 |  |
| arousal\_regulator | The Arousal Regulator | job | connect | 1 |  |
| arousal\_regulator | The Arousal Regulator | entry\_point | stress\_relief | 2 |  |
| arousal\_regulator | The Arousal Regulator | entry\_point | alone\_disconnected | 2 |  |
| arousal\_regulator | The Arousal Regulator | entry\_point | night\_regulation | 1 |  |
| arousal\_regulator | The Arousal Regulator | entry\_point | under\_stimulated | 1 |  |
| arousal\_regulator | The Arousal Regulator | loop\_shape | time\_sink\_binge | 2 |  |
| arousal\_regulator | The Arousal Regulator | loop\_shape | completion | 2 |  |
| arousal\_regulator | The Arousal Regulator | loop\_shape | quick\_check | 1 |  |
| arousal\_regulator | The Arousal Regulator | aftertaste | guilty\_ashamed | 2 |  |
| arousal\_regulator | The Arousal Regulator | aftertaste | numb | 1 |  |
| arousal\_regulator | The Arousal Regulator | aftertaste | more\_lonely | 1 |  |
| arousal\_regulator | The Arousal Regulator | cost\_domain | friendships\_dating\_social | 2 |  |
| arousal\_regulator | The Arousal Regulator | cost\_domain | mood\_anxiety | 1 |  |
| arousal\_regulator | The Arousal Regulator | cost\_domain | sleep | 1 |  |
| arousal\_regulator | The Arousal Regulator | cost\_domain | work\_school\_responsibilities | 1 |  |
| arousal\_regulator | The Arousal Regulator | platform\_feature | adult\_or\_intimacy\_content | 3 |  |
| arousal\_regulator | The Arousal Regulator | tie\_breaker | private\_changes\_channel | 4 |  |
| second\_self | The Second Self | hook | second\_self | 4 |  |
| second\_self | The Second Self | hook | parasocial\_bond | 1 |  |
| second\_self | The Second Self | hook | belonging | 1 |  |
| second\_self | The Second Self | hook | climb | 1 |  |
| second\_self | The Second Self | hook | zone\_out | 1 |  |
| second\_self | The Second Self | job | empower | 2 |  |
| second\_self | The Second Self | job | soothe | 2 |  |
| second\_self | The Second Self | job | validate | 2 |  |
| second\_self | The Second Self | job | connect | 1 |  |
| second\_self | The Second Self | entry\_point | alone\_disconnected | 2 |  |
| second\_self | The Second Self | entry\_point | stress\_relief | 1 |  |
| second\_self | The Second Self | entry\_point | night\_regulation | 1 |  |
| second\_self | The Second Self | entry\_point | task\_avoidance | 1 |  |
| second\_self | The Second Self | loop\_shape | time\_sink\_binge | 2 |  |
| second\_self | The Second Self | loop\_shape | social\_participation | 2 |  |
| second\_self | The Second Self | loop\_shape | completion | 1 |  |
| second\_self | The Second Self | aftertaste | connected | 1 |  |
| second\_self | The Second Self | aftertaste | calmer\_regulated | 1 |  |
| second\_self | The Second Self | aftertaste | more\_lonely | 1 |  |
| second\_self | The Second Self | aftertaste | worse\_self\_body | 1 |  |
| second\_self | The Second Self | cost\_domain | friendships\_dating\_social | 2 |  |
| second\_self | The Second Self | cost\_domain | work\_school\_responsibilities | 1 |  |
| second\_self | The Second Self | cost\_domain | mood\_anxiety | 1 |  |
| second\_self | The Second Self | tie\_breaker | real\_life\_no\_room | 4 |  |

| Phenotype ID | Gate ID | Gate Type | Required Signals Expression | Action If Missing | Score Cap | Notes |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| night\_regulator | GATE\_NIGHT\_01 | soft\_required\_any | entry\_point:night\_regulation \| tie\_breaker:night\_avoid\_head \| cost\_domain:sleep+loop\_shape:time\_sink\_binge | cap\_score | 6 | Do not let generic soothing win Night Regulator without a night/sleep signal. |
| time\_reclaimer | GATE\_TIME\_01 | soft\_required\_any | tie\_breaker:night\_only\_time\_mine \| entry\_point:night\_regulation+cost\_domain:sleep | cap\_score | 6 | Needs late-night use plus reclaimed-time signal or sleep cost. |
| autopilot\_drifter | GATE\_DRIFT\_01 | soft\_required\_any | loop\_shape:autopilot \| entry\_point:gap\_filling \| entry\_point:anytime\_no\_pattern \| tie\_breaker:hand\_went\_there | cap\_score | 7 | Requires automaticity or transition/gap pattern. |
| competence\_refuge | GATE\_REFUGE\_01 | soft\_required\_any | hook:climb \| job:empower \| platform\_feature:gaming\_ranked\_progress \| tie\_breaker:effort\_turns\_progress | cap\_score | 7 | Requires progress, competence, mastery, or empowerment signal. |
| optimizer\_spiral | GATE\_OPT\_01 | soft\_required\_all | hook:rabbit\_hole OR platform\_feature:ai\_chatbot\_support; plus entry\_point:task\_avoidance OR loop\_shape:completion OR tie\_breaker:preparing\_becomes\_thing | cap\_score | 7 | Needs preparation/research plus avoidance or completion-loop behavior. |
| reassurance\_checker | GATE\_REASSURE\_01 | soft\_required\_any | hook:tethered\_check \| loop\_shape:quick\_check \| tie\_breaker:see\_if\_changed | cap\_score | 7 | Short checking must be visible. |
| vigilant\_scanner | GATE\_SCAN\_01 | soft\_required\_any | hook:rabbit\_hole+job:reassure \| platform\_feature:news\_health\_search \| tie\_breaker:read\_enough\_safe | cap\_score | 7 | Research/search must be about safety, certainty, decision, threat, or health. |
| validation\_monitor | GATE\_VALIDATION\_01 | soft\_required\_any | platform\_feature:posting\_metrics \| job:validate+loop\_shape:waiting\_refresh \| tie\_breaker:checking\_reaction\_to\_me | cap\_score | 7 | Needs own-output response monitoring, not generic checking. |
| comparison\_spiral | GATE\_COMPARE\_01 | soft\_required\_any | hook:mirror \| job:compare \| aftertaste:worse\_self\_body \| tie\_breaker:see\_where\_i\_stand | cap\_score | 7 | Needs self-ranking or self-image signal. |
| always\_on\_responder | GATE\_RESPOND\_01 | soft\_required\_any | hook:tethered\_social \| loop\_shape:social\_participation+job:connect \| tie\_breaker:failing\_someone | cap\_score | 7 | Needs reply pressure, availability, or social obligation. |
| online\_home | GATE\_HOME\_01 | soft\_required\_any | hook:belonging \| platform\_feature:community\_server\_group \| tie\_breaker:these\_are\_my\_people | cap\_score | 7 | Needs group/community belonging, not just one-to-one connection. |
| always\_there\_confidant | GATE\_CONFIDANT\_01 | soft\_required\_any | hook:companion+platform\_feature:ai\_chatbot\_support \| tie\_breaker:always\_answers | cap\_score | 7 | Needs one-to-one responsive digital presence. |
| creator\_anchor | GATE\_CREATOR\_01 | soft\_required\_any | hook:parasocial\_bond \| platform\_feature:creator\_streamer\_media \| tie\_breaker:voice\_part\_of\_day | cap\_score | 7 | Needs creator/personality attachment. |
| activation\_loop | GATE\_ACTIVATION\_01 | soft\_required\_any | hook:activation \| tie\_breaker:angry\_feels\_awake | cap\_score | 7 | Needs anger, conflict, drama, threat, or moral-intensity signal. |
| reward\_chaser | GATE\_REWARD\_01 | hard\_required\_any | hook:reward\_chase \| platform\_feature:betting\_trading\_gambling \| platform\_feature:shopping\_deals\_marketplace \| tie\_breaker:next\_one\_could\_be\_one | block |  | Do not assign Reward Chaser from generic stimulation alone. |
| arousal\_regulator | GATE\_AROUSAL\_01 | hard\_required\_all | hook:arousal\_pull OR platform\_feature:adult\_or\_intimacy\_content; plus one of cost\_domain, severity\_marker, aftertaste:guilty\_ashamed, tie\_breaker:private\_changes\_channel | block\_or\_adaptive\_note |  | Do not pathologize arousal content without control, distress, values conflict, or cost. |
| second\_self | GATE\_SECOND\_01 | hard\_required\_any | hook:second\_self \| tie\_breaker:real\_life\_no\_room | block |  | Do not assign from generic fantasy unless identity-immersion signal is present. |

| Rule ID | Priority | Condition | Action | Target Phenotype | Severity Floor | Notes |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| HR\_LOW\_001 | 1 | baseline\_self\_rating\<=1 AND control\_frequency\<=1 AND no severity markers except none AND cost\_domain:none\_meaningful | Return no dominant problematic loop, or light grip if a benign pattern is still useful. | all | light\_grip | Prevents over-labeling normal or low-cost use. |
| HR\_REWARD\_001 | 2 | (hook:reward\_chase OR platform\_feature:betting\_trading\_gambling) AND cost\_domain:money AND any(severity\_marker:loss\_control, failed\_cutback, concealment, interference\_harm) | Force reward\_chaser into primary or secondary. Set severity floor to high\_impact\_loop. | reward\_chaser | high\_impact\_loop | Money plus impaired control is a high-urgency pattern. |
| HR\_REWARD\_002 | 3 | hook:reward\_chase AND tie\_breaker:next\_one\_could\_be\_one AND aftertaste:behind\_panicked | Boost reward\_chaser by +4 and show loss-chasing language if relevant. | reward\_chaser |  | Handles loss recovery or chasing the next win. |
| HR\_AROUSAL\_001 | 4 | hook:arousal\_pull AND no cost\_domain except none\_meaningful AND no control/severity marker AND no distress aftertaste | Do not assign arousal\_regulator as a problem result. Allow no dominant loop or adaptive mention. | arousal\_regulator | light\_grip | Protects normal sexuality, desire, fantasy, and exploration. |
| HR\_SECOND\_001 | 5 | hook:second\_self AND no cost\_domain except none\_meaningful AND control\_frequency\<=1 | Allow second\_self as adaptive or secondary descriptive result, not a problematic loop. | second\_self | light\_grip | Protects identity exploration, roleplay, gaming, fandom, creativity, and queer/gender exploration. |
| HR\_HOME\_001 | 6 | hook:belonging AND aftertaste:connected AND no relationship/offline cost AND control\_frequency\<=1 | Do not label online\_home as problematic. Treat as adaptive online belonging. | online\_home | light\_grip | Online belonging can be protective and real. |
| HR\_NIGHT\_001 | 7 | entry\_point:night\_regulation AND cost\_domain:sleep AND control\_frequency\>=3 | Set severity floor to steady\_pull. If loss\_control or interference\_harm also present, floor deep\_loop. | night\_regulator\_or\_time\_reclaimer | steady\_pull | Sleep cost plus control difficulty should not be scored as trivial. |
| HR\_AWARENESS\_001 | 8 | severity\_marker:interference\_harm AND severity\_marker:failed\_cutback AND severity\_marker:loss\_control | Set severity floor to high\_impact\_loop regardless of phenotype. | all | high\_impact\_loop | Classic high-impairment pattern without using diagnostic language. |
| HR\_TIE\_001 | 9 | reward\_chaser and activation\_loop both high, but cost\_domain:money present | Reward Chaser wins primary; Activation may remain secondary. | reward\_chaser |  | Financial harm should outrank anger/intensity when both appear. |
| HR\_TIE\_002 | 10 | night\_regulator and time\_reclaimer both high | Use tie\_breaker:night\_avoid\_head for Night Regulator; tie\_breaker:night\_only\_time\_mine for Time Reclaimer. If neither, choose Night Regulator when more\_anxious/numb; choose Time Reclaimer when tired/no\_different. | night\_regulator\_or\_time\_reclaimer |  | Separates off-switch from reclaimed time. |
| HR\_SAFETY\_001 | 11 | free\_text contains immediate self-harm, suicide, abuse, unsafe driving, or acute financial danger | Bypass normal result-only flow and show urgent support or crisis-safe routing, then optionally show quiz result after safety message. | all | safety\_override | Website safety guardrail, not a phenotype score. |
| HR\_LANGUAGE\_001 | 12 | any result | Never output diagnosis, addiction label, moral failure, or deterministic identity. Use loop, pattern, pull, or relationship with tech. | all |  | Copy safety rule for behavioral health responsibility. |

| Phenotype A | Phenotype B | Rule | Useful Tie-Breaker Tags |
| :-: | :-: | :-: | :-: |
| night\_regulator | time\_reclaimer | If user says quiet/thoughts/dread/loneliness/silence, choose Night Regulator. If user says only time mine/freedom/control/revenge bedtime, choose Time Reclaimer. | night\_avoid\_head vs night\_only\_time\_mine |
| reassurance\_checker | vigilant\_scanner | Short signal checks for changed notifications or replies go Reassurance Checker. Longer research/search/refresh for safety or certainty goes Vigilant Scanner. | see\_if\_changed vs read\_enough\_safe |
| validation\_monitor | comparison\_spiral | Checking response to my own post/message/match goes Validation Monitor. Measuring myself against other people goes Comparison Spiral. | checking\_reaction\_to\_me vs see\_where\_i\_stand |
| competence\_refuge | second\_self | Progress, mastery, rank, and capability go Competence Refuge. Avatar, identity, role, fantasy, or alternate self goes Second Self. | effort\_turns\_progress vs real\_life\_no\_room |
| online\_home | always\_on\_responder | A community becoming my world goes Online Home. Feeling obligated to reply or stay reachable goes Always-On Responder. | these\_are\_my\_people vs failing\_someone |
| always\_there\_confidant | creator\_anchor | Responsive one-to-one AI/chatbot/bot presence goes Always-There Confidant. One-way familiar creator or streamer bond goes Creator Anchor. | always\_answers vs voice\_part\_of\_day |
| activation\_loop | reward\_chaser | Anger, drama, and moral charge go Activation. Uncertain win, loss recovery, rare pull, bet, trade, match, deal, or money risk goes Reward Chaser. | angry\_feels\_awake vs next\_one\_could\_be\_one |
| autopilot\_drifter | reward\_chaser | Joyless automatic gap filling goes Autopilot Drifter. Searching for a better post, rare outcome, or possible win goes Reward Chaser. | hand\_went\_there vs next\_one\_could\_be\_one |
| optimizer\_spiral | vigilant\_scanner | Preparing to act, tool setup, AI prompting, and learning instead of starting goes Optimizer Spiral. Searching for safety or threat certainty goes Vigilant Scanner. | preparing\_becomes\_thing vs read\_enough\_safe |
| always\_there\_confidant | online\_home | One-to-one disclosure to a responsive presence goes Confidant. Group, server, fandom, or community belonging goes Online Home. | always\_answers vs these\_are\_my\_people |

| Rule Type | Signal / Band | Points or Range | Action | Notes |
| :-: | :-: | :-: | :-: | :-: |
| component | baseline\_self\_rating | 0 to 4 | Add selected value | Direct baseline self-rating from quiz. |
| component | control\_frequency | 0 to 4 | Add selected value | How often user keeps using even though part wants to stop. |
| severity\_marker | loss\_control | \+2 | Add if selected | Keeps going after wanting to stop. |
| severity\_marker | failed\_cutback | \+2 | Add if selected | Tried to reduce and could not. |
| severity\_marker | time\_creep | \+1 | Add if selected | Just a little turns into more. |
| severity\_marker | withdrawal\_restlessness | \+2 | Add if selected | Restless, anxious, irritated, or off when unable to use. |
| severity\_marker | mental\_pull | \+1 | Add if selected | Keeps thinking about it elsewhere. |
| severity\_marker | concealment | \+2 | Add if selected | Hides or downplays. |
| severity\_marker | interference\_harm | \+3 | Add if selected | Interference with sleep, work, mood, money, body, or relationships. |
| severity\_marker | compensation\_stage | \+2 | Add if selected | Does not feel good anymore but still helps regulate. |
| cost\_count | cost\_domains | \+1 each, cap +4 | Add for each cost except none\_meaningful | Functional impairment count. |
| modifier | money\_with\_reward | \+1 extra | If cost\_domain:money and reward\_chaser score is top 3 | Financial risk deserves extra urgency. |
| modifier | sleep\_with\_night | \+1 extra | If cost\_domain:sleep and entry\_point:night\_regulation | Sleep-specific cost with night loop. |
| modifier | self\_body\_with\_comparison | \+1 extra | If cost\_domain:self\_body\_image and comparison\_spiral score is top 3 | Self/body cost central to comparison loop. |
| modifier | no\_meaningful\_cost | cap total at 4 unless hard rule fires | If cost\_domain:none\_meaningful and no other cost | Prevents high severity without impairment. |
| band | light\_grip | 0 to 4 | Result label | Use gentle language. May be a pattern but not necessarily a problem. |
| band | steady\_pull | 5 to 9 | Result label | Clear pull with some cost or control difficulty. |
| band | deep\_loop | 10 to 15 | Result label | Meaningful impairment, repeated control difficulty, or multiple costs. |
| band | high\_impact\_loop | 16 plus or hard-rule floor | Result label | High-impact pattern. Suggest support without diagnosing. |

| Output Field | Type | Definition | Example |
| :-: | :-: | :-: | :-: |
| primary\_phenotype\_id | string | Highest eligible phenotype after hard rules and tie-breakers. | night\_regulator |
| primary\_phenotype\_name | string | User-facing phenotype name. | The Night Regulator |
| primary\_score | number | Final point score after gates, boosts, caps, and hard rules. | 12.5 |
| primary\_confidence | enum high\|medium\|low\|mixed | High if score\>=8 and margin\>=2.5. Medium if score\>=6 and margin\>=1. Low if score\<6. Mixed if top two are close and both meaningful. | high |
| secondary\_phenotype\_id | string\|null | Second eligible phenotype if score\>=5 or clinically/product-wise useful. Null if no meaningful second result. | time\_reclaimer |
| severity\_score | integer/number | Separate severity score. Do not use phenotype score as severity. | 9 |
| severity\_label | enum light\_grip\|steady\_pull\|deep\_loop\|high\_impact\_loop | Band from Severity Rules after floors/caps. | steady\_pull |
| top\_hook\_tags | array | Top selected hook tags by weight or frequency. | \['zone\_out','endless\_feed'\] |
| top\_job\_tags | array | Top selected emotional jobs. | \['soothe'\] |
| top\_entry\_points | array | Selected entry points used in formulation. | \['night\_regulation'\] |
| top\_loop\_shapes | array | Selected loop shapes used in formulation. | \['time\_sink\_binge'\] |
| cost\_domains | array | Selected cost domains excluding none\_meaningful. | \['sleep','mood\_anxiety'\] |
| hard\_rules\_triggered | array | List of hard rule IDs that fired. | \['HR\_NIGHT\_001'\] |
| formulation\_sentence | string | Deterministic clinician/product summary. | The Night Regulator, steady pull, driven by Zone-Out and Soothe Me, showing a Time-Sink loop, with sleep and mood cost. |
| copy\_generation\_mode | enum deterministic\|ai\_assisted | Use deterministic by default. AI may only rewrite from structured output, not change assignment. | deterministic |
| ai\_allowed\_inputs | object | If AI is used, pass only structured scores/tags plus approved library copy. Do not pass raw sensitive free text unless consented and necessary. | {scores,tags,result\_copy,guardrails} |
| ai\_forbidden\_actions | array | AI cannot diagnose, override hard rules silently, invent phenotype, or intensify severity without a structured rule. | \['diagnose','invent','override\_without\_reason'\] |

| Order | Pseudocode |
| :-: | :-: |
| 1 | signals = normalizeAnswers(quizAnswers) |
| 2 | if hasLowProblemPattern(signals): return lowConcernResult(signals) |
| 3 | scores = initPhenotypeScores(PHENOTYPES) |
| 4 | for each signal in signals: for each matching weight row: scores\[phenotype\] += weight \* anchorMultiplier(signal) |
| 5 | scores = applyEligibilityGates(scores, signals) |
| 6 | hardRuleEffects = evaluateHardRules(signals, scores) |
| 7 | scores = applyHardRuleScoreEffects(scores, hardRuleEffects) |
| 8 | ranked = rankEligiblePhenotypes(scores) |
| 9 | ranked = applyTieBreakers(ranked, signals) |
| 10 | severityScore = calculateSeverity(signals) |
| 11 | severityScore = applySeverityFloorsAndCaps(severityScore, hardRuleEffects, signals) |
| 12 | confidence = calculateConfidence(ranked\[0\], ranked\[1\], hardRuleEffects) |
| 13 | return buildOutputContract(primary=ranked\[0\], secondary=ranked\[1\], severity=severityScore, signals, hardRuleEffects, confidence) |
| 14 | Optional: pass outputContract plus approved library copy into AI copy layer for tone only. |

| Case ID | Input Signals | Expected Primary | Expected Secondary | Severity | Why |
| :-: | :-: | :-: | :-: | :-: | :-: |
| EX\_NIGHT\_01 | hook:zone\_out; job:soothe; entry\_point:night\_regulation; loop\_shape:time\_sink\_binge; cost\_domain:sleep; aftertaste:tired; tie\_breaker:night\_avoid\_head | night\_regulator |  | steady\_pull | Night, off-switch, sleep cost. |
| EX\_TIME\_01 | hook:endless\_feed; job:stimulate; entry\_point:night\_regulation; loop\_shape:time\_sink\_binge; cost\_domain:sleep; tie\_breaker:night\_only\_time\_mine | time\_reclaimer | night\_regulator | steady\_pull | Night use is about reclaimed personal time. |
| EX\_REASSURE\_01 | hook:tethered\_check; job:reassure; loop\_shape:quick\_check; entry\_point:morning\_check\_in; cost\_domain:focus\_attention; tie\_breaker:see\_if\_changed | reassurance\_checker |  | steady\_pull | Short checks for changed signals. |
| EX\_SCAN\_01 | hook:rabbit\_hole; job:reassure; loop\_shape:completion; platform\_feature:news\_health\_search; aftertaste:more\_anxious; tie\_breaker:read\_enough\_safe | vigilant\_scanner |  | steady\_pull | Searching to feel safe, but anxiety rises. |
| EX\_OPT\_01 | hook:rabbit\_hole; hook:companion; job:empower; entry\_point:task\_avoidance; loop\_shape:completion; aftertaste:behind\_panicked; tie\_breaker:preparing\_becomes\_thing | optimizer\_spiral | vigilant\_scanner | steady\_pull | Preparation is replacing action. |
| EX\_VALIDATE\_01 | hook:tethered\_check; job:validate; loop\_shape:waiting\_refresh; platform\_feature:posting\_metrics; aftertaste:more\_anxious; tie\_breaker:checking\_reaction\_to\_me | validation\_monitor | reassurance\_checker | steady\_pull | Own post/message response checking. |
| EX\_COMPARE\_01 | hook:mirror; job:compare; aftertaste:worse\_self\_body; cost\_domain:self\_body\_image; tie\_breaker:see\_where\_i\_stand | comparison\_spiral |  | steady\_pull | Self-ranking and self/body cost. |
| EX\_HOME\_01 | hook:belonging; job:connect; loop\_shape:social\_participation; platform\_feature:community\_server\_group; aftertaste:connected; cost\_domain:friendships\_dating\_social; tie\_breaker:these\_are\_my\_people | online\_home |  | steady\_pull | Real online belonging with offline thinning. |
| EX\_CONFIDANT\_01 | hook:companion; job:connect; entry\_point:alone\_disconnected; platform\_feature:ai\_chatbot\_support; aftertaste:connected; tie\_breaker:always\_answers | always\_there\_confidant |  | light\_grip | One-to-one responsive support, no major cost yet. |
| EX\_REWARD\_01 | hook:reward\_chase; platform\_feature:betting\_trading\_gambling; cost\_domain:money; severity\_marker:loss\_control; severity\_marker:concealment; tie\_breaker:next\_one\_could\_be\_one | reward\_chaser |  | high\_impact\_loop | Hard rule HR\_REWARD\_001 fires. |
| EX\_AROUSAL\_01 | hook:arousal\_pull; job:soothe; aftertaste:guilty\_ashamed; severity\_marker:time\_creep; cost\_domain:mood\_anxiety; tie\_breaker:private\_changes\_channel | arousal\_regulator |  | steady\_pull | Regulation plus distress/control signal, not content alone. |
| EX\_SECOND\_ADAPT\_01 | hook:second\_self; job:empower; aftertaste:connected; cost\_domain:none\_meaningful; control\_frequency:0; tie\_breaker:real\_life\_no\_room | second\_self\_adaptive\_note |  | light\_grip | Hard rule protects adaptive identity exploration. |
| EX\_LOW\_01 | entry\_point:not\_problem; cost\_domain:none\_meaningful; severity\_marker:none; baseline\_self\_rating:0; control\_frequency:0 | no\_dominant\_problematic\_loop |  | light\_grip | Hard rule HR\_LOW\_001 fires. |