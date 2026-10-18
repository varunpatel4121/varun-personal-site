"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./goals.module.css";

const PHOTO_PATH = "/images/goals/2026-fall";
const sections = [
  ["board", "The board"],
  ["fitness", "Fitness & food"],
  ["habits", "Mental health & habits"],
  ["mentorship", "Mentorship"],
  ["creative", "Creative work"],
  ["career", "Career exploration"],
] as const;

function jumpToSection(id: string) {
  if (window.location.hash === `#${id}`) {
    document.getElementById(id)?.scrollIntoView();
    document.getElementById(id)?.focus({ preventScroll: true });
  } else {
    window.location.hash = id;
  }
}

function SectionNavigation() {
  const [active, setActive] = useState<string>("board");
  const activeIndex = sections.findIndex(([id]) => id === active);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string = "board";
      for (const [id] of sections) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= 190) current = id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const followHash = () => {
      const id = window.location.hash.slice(1);
      if (!sections.some(([section]) => section === id)) return;
      const section = document.getElementById(id);
      section?.scrollIntoView();
      section?.focus({ preventScroll: true });
      schedule();
    };
    const initialFrame = requestAnimationFrame(() => {
      followHash();
      schedule();
    });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", followHash);
    return () => {
      cancelAnimationFrame(initialFrame);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", followHash);
    };
  }, []);

  return (
    <>
      <aside className={styles.sideIndex}>
        <nav aria-label="Goal sections">
          <span className={styles.indexLabel}>On the board</span>
          {sections.map(([id, label], index) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
              <span className={styles.indexNumber}>{index === 0 ? "↗" : `0${index}`}</span>
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <span className={styles.indexSignature} aria-hidden="true">v.</span>
      </aside>
      <nav className={styles.mobileIndex} aria-label="Mobile goal sections">
        <button aria-label="Previous section" disabled={activeIndex === 0} onClick={() => jumpToSection(sections[activeIndex - 1][0])}>←</button>
        <div className={styles.sectionPicker}>
          <span aria-hidden="true">{activeIndex === 0 ? "↗" : `0${activeIndex}`}</span>
          <select aria-label="Jump to a goal" value={active} onChange={(event) => jumpToSection(event.target.value)}>
            {sections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <span className={styles.pickerChevron} aria-hidden="true">⌄</span>
        </div>
        <button aria-label="Next section" disabled={activeIndex === sections.length - 1} onClick={() => jumpToSection(sections[activeIndex + 1][0])}>→</button>
      </nav>
    </>
  );
}

function Photo({ name, alt, className = "", position = "50% 50%", eager = false }: {
  name: string;
  alt: string;
  className?: string;
  position?: string;
  eager?: boolean;
}) {
  return (
    <figure className={`${styles.photo} ${className}`}>
      <div className={styles.photoImage}>
        <Image src={`${PHOTO_PATH}/${name}.webp`} alt={alt} fill
          sizes="(max-width: 700px) 85vw, (max-width: 1100px) 45vw, 480px"
          style={{ objectPosition: position }} loading={eager ? "eager" : "lazy"} />
      </div>
    </figure>
  );
}

function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg className={`${styles.asterisk} ${className}`} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M47 5 52 94M9 26 91 73M9 77 90 23" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function PillarHeading({ number, name }: { number: string; name: string }) {
  return (
    <div className={styles.pillarHeading}>
      <span className={styles.pillarNumber} aria-hidden="true">{number}</span>
      <h2>{name}</h2>
      <span className={styles.pillarRule} />
    </div>
  );
}

function Targets({ label, rows }: {
  label: string;
  rows: { goal: string; values: [string, string, string] }[];
}) {
  return (
    <table className={styles.targets}>
      <caption className="sr-only">{label}</caption>
      <thead><tr>
        <th scope="col"><span className="sr-only">Goal</span></th>
        <th scope="col">Minimum</th><th scope="col">Target</th><th scope="col">Ideal</th>
      </tr></thead>
      <tbody>{rows.map(({ goal, values }) => (
        <tr key={goal}>
          <th scope="row">{goal}</th>
          {values.map((value, index) => <td key={index}>{value}</td>)}
        </tr>
      ))}</tbody>
    </table>
  );
}

function Paper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.paper} ${className}`}>{children}</div>;
}

export function VisionBoard() {
  return (
    <div className={styles.board}>
      <SectionNavigation />
      <div className={styles.boardContent}>
        <section id="board" className={styles.hero} tabIndex={-1} aria-labelledby="board-title">
          <div className={styles.heroWords}>
            <p className={styles.eyebrow}>October—December 2026</p>
            <h1 id="board-title">The rest of<br /><em>this year.</em></h1>
            <Asterisk className={styles.heroMark} />
          </div>
          <div className={styles.heroCollage} aria-label="Personal photo collage">
            <Photo name="sunset" alt="Orange sunset above a layer of clouds" className={styles.heroSunset} eager />
            <Photo name="together" alt="A couple smiling at one another beside cactus plants" className={styles.heroPortrait} eager />
            <Photo name="seaside" alt="A couple standing together on the beach at sunset" className={styles.heroSmall} eager />
            <span className={styles.yearMark} aria-hidden="true">’26</span>
          </div>
        </section>

        <section id="fitness" className={styles.pillar} tabIndex={-1} aria-labelledby="fitness-title">
          <div id="fitness-title"><PillarHeading number="01" name="Fitness & food" /></div>
          <div className={styles.fitnessLayout}>
            <div className={styles.fitnessPortrait}>
              <span className={styles.photoWord} aria-hidden="true">stronger</span>
              <Photo name="fitness" alt="A fitness progress photo in a gym mirror" className={styles.fitnessPhoto} position="50% 60%" />
            </div>
            <Paper className={styles.fitnessPaper}>
              <Targets label="Fitness and food targets by December 31" rows={[
                { goal: "Pull-ups", values: ["8", "9", "10"] },
                { goal: "Push-ups", values: ["14", "17", "20"] },
                { goal: "Weight loss", values: ["4 lb", "5 lb", "6 lb"] },
                { goal: "Protein average", values: ["85", "90", "100"] },
              ]} />
              <p className={styles.smallCopy}>Skip ice cream, cakes, and cookies.</p>
            </Paper>
          </div>
        </section>

        <section id="habits" className={styles.pillar} tabIndex={-1} aria-labelledby="habits-title">
          <div id="habits-title"><PillarHeading number="02" name="Mental health & habits" /></div>
          <div className={styles.habitsLayout}>
            <Paper className={styles.habitsPaper}>
              <h3>Meditate<br /><em>every day.</em></h3>
              <Targets label="Meditation practice each week" rows={[
                { goal: "Sessions", values: ["Daily", "10 / wk", "14 / wk"] },
              ]} />
              <ul className={styles.noteList}>
                <li>Read at night.</li>
                <li>Less phone time and fewer reels.</li>
                <li>Keep the promises I make to myself.</li>
              </ul>
            </Paper>
            <div className={styles.habitsPhotos}>
              <Photo name="park" alt="A quiet afternoon relaxing on a picnic blanket in a green city park" className={styles.parkPhoto} position="50% 58%" />
              <Photo name="at-home" alt="Two people wearing face masks and making peace signs at home" className={styles.homePhoto} />
              <Asterisk className={styles.habitsMark} />
            </div>
          </div>
        </section>

        <section id="mentorship" className={styles.pillar} tabIndex={-1} aria-labelledby="mentorship-title">
          <div id="mentorship-title"><PillarHeading number="03" name="Mentorship" /></div>
          <div className={styles.mentorshipLayout}>
            <Photo name="campus" alt="Two people standing together on the lawn outside a domed campus building" className={styles.campusPhoto} position="50% 62%" />
            <Paper className={styles.mentorshipPaper}>
              <p className={styles.handwritten}>Jes + me</p>
              <h3>Work together<br /><em>every week.</em></h3>
              <ul className={styles.noteList}>
                <li>Build practical real estate experience.</li>
                <li>Analyze a couple of properties we own.</li>
                <li>Explore courses and jobs for next year.</li>
                <li>Help Jes choose a confident next step.</li>
              </ul>
            </Paper>
          </div>
        </section>

        <section id="creative" className={styles.pillar} tabIndex={-1} aria-labelledby="creative-title">
          <div id="creative-title"><PillarHeading number="04" name="Creative work" /></div>
          <div className={styles.creativeLayout}>
            <Paper className={styles.creativePaper}>
              <h3>Make it.<br /><em>Publish it.</em></h3>
              <Targets label="Published podcast and reel totals by December 31" rows={[
                { goal: "Podcast episodes", values: ["1", "2", "3"] },
                { goal: "Reels", values: ["5", "7", "9"] },
              ]} />
              <p className={styles.smallCopy}>Fully edited and published by December.</p>
              <ul className={styles.noteList}>
                <li>Make one thing in product design. Lead the group project.</li>
                <li>Take Gen AI seriously in class.</li>
              </ul>
            </Paper>
            <div className={styles.creativePhotos}>
              <Photo name="dance" alt="A lively moment dancing in colorful sunglasses" className={styles.dancePhoto} />
              <Paper className={styles.coachingNote}>
                <h4 className={styles.handwritten}>Practice prioritization.</h4>
                <p>Coach check-in every 6 weeks.</p>
              </Paper>
            </div>
          </div>
        </section>

        <section id="career" className={styles.pillar} tabIndex={-1} aria-labelledby="career-title">
          <div id="career-title"><PillarHeading number="05" name="Career exploration" /></div>
          <div className={styles.careerLayout}>
            <Photo name="beach" alt="A portrait beside the ocean under a cloudy sunset sky" className={styles.beachPhoto} />
            <Paper className={styles.careerPaper}>
              <h3>Try it.<br /><em>See how it feels.</em></h3>
              <p className={styles.bodyCopy}>A few targeted applications and conversations for an in-semester internship.</p>
              <ul className={styles.noteList}>
                <li>Mental health startups</li>
                <li>Real estate analyst roles</li>
              </ul>
              <p className={styles.handwritten}>a few hours a week</p>
              <div className={styles.founderNote}>
                <p>Explore ideas with Wharton founders.</p>
                <Targets label="Total career conversations by December 31" rows={[
                  { goal: "Career conversations", values: ["3", "5", "7"] },
                ]} />
              </div>
            </Paper>
          </div>
        </section>
        <div className={styles.closingNote}><a href="#board">Back to the board ↑</a><span className={styles.handwritten}>Varun</span></div>
      </div>
    </div>
  );
}
