# CricScore Pro V2 — User Guide

**Production URL:** https://barikallahwork-cmd.github.io/cricket-scorer-v2/  
**Repository:** https://github.com/barikallahwork-cmd/cricket-scorer-v2

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating a Match](#creating-a-match)
3. [Match Flow](#match-flow)
4. [Match Formats](#match-formats)
5. [Delivery Types (Extras)](#delivery-types-extras)
6. [Wicket Types](#wicket-types)
7. [Sharing a Live Match](#sharing-a-live-match)
8. [Join Match Codes](#join-match-codes)
9. [Display / Second Screen](#display--second-screen)
10. [Grounds Dashboard](#grounds-dashboard)
11. [Tournament Module](#tournament-module)
12. [Data & Persistence](#data--persistence)
13. [Quick Reference](#quick-reference)

---

## Getting Started

Open the app at **https://barikallahwork-cmd.github.io/cricket-scorer-v2/**

The homepage shows all your local matches and gives access to four main areas:

| Button | What it does |
|---|---|
| **New Match** | Create and score a new match |
| **Join Match** | Join any live match using a code |
| **Grounds** | View all live matches across all devices in real time |
| **Tournament** | Create and manage tournaments |

---

## Creating a Match

Click **New Match** and fill in:

| Field | Description |
|---|---|
| **Format** | T20, ODI, Test, or Custom |
| **Overs** | Maximum overs per innings (e.g. 20 for T20) |
| **Venue** | Ground name — shown on display screen |
| **Date** | Match date |
| **Team 1 & 2** | Name, short name (3–4 letters), jersey colour, 11 players |

Once created, three codes are automatically generated for the match:

| Code | Prefix | Example | Access Level |
|---|---|---|---|
| **Viewer Code** | CRK | CRK82741 | Watch live — read only |
| **Scorer Code** | SCR | SCR5528 | Full ball-by-ball scoring |
| **Admin Code** | ADM | ADM1122 | End match, view all codes |

---

## Match Flow

Every match goes through these stages in order:

```
Toss → Innings Setup → Live Scoring → Innings Break → Second Innings → Finished
```

**Toss** — Select which team won the toss and whether they chose to bat or bowl.

**Innings Setup** — Select the opening batsmen (striker + non-striker) and the opening bowler.

**Live Scoring** — Score each delivery using the ball controls. After every 6 legal balls the app prompts for the next bowler. After a wicket it prompts for the next batsman.

**Innings Break** — Shown between the first and second innings. Target is calculated automatically.

**Second Innings** — Same flow. Match ends automatically when the target is chased, all wickets fall, or overs are completed.

---

## Match Formats

| Format | Typical Overs | Notes |
|---|---|---|
| **T20** | 20 | 20-over format, fast-paced |
| **ODI** | 50 | One day, 50 overs per side |
| **Test** | 90 | Multi-innings (uses 90 as over cap for display) |
| **Custom** | Any | Set your own over limit |

---

## Delivery Types (Extras)

| Type | Counts as legal ball? | Runs to batsman? | Notes |
|---|---|---|---|
| **Normal** | Yes | Yes | Standard delivery |
| **Wide** | No | No | 1 extra + any runs scored |
| **No Ball** | No | Yes | 1 extra + runs to bat, next ball is Free Hit |
| **Bye** | Yes | No | Runs to team, not to batsman |
| **Leg Bye** | Yes | No | Runs off the pad, not to batsman |
| **Penalty** | No | No | 5 penalty runs awarded to either team |

> **Free Hit** — After a no ball, the next delivery is a free hit. The batsman can only be dismissed by Run Out.

---

## Wicket Types

| Type | Description |
|---|---|
| **Bowled** | Ball hits the stumps directly |
| **Caught** | Fielder catches the ball before it bounces |
| **LBW** | Ball would have hit stumps, strikes leg instead |
| **Run Out** | Batsman is short of crease during a run |
| **Stumped** | Keeper removes bails while batsman is out of crease |
| **Hit Wicket** | Batsman dislodges the bails themselves |
| **Retired Hurt** | Batsman leaves field injured — innings continues |
| **Retired** | Batsman voluntarily retires |
| **Obstructing Field** | Batsman deliberately blocks a fielder |
| **Timed Out** | New batsman takes too long to arrive |
| **Handled Ball** | Batsman handles the ball deliberately |

---

## Sharing a Live Match

Click the **QR icon** in the scorer header to open the Share panel. It shows:

- **QR Code** — scan with any phone to open the live scoreboard instantly
- **Viewer Code** (green) — share with anyone to watch
- **Scorer Code** (blue) — share with another scorer at the same ground
- **Admin Code** (amber) — keep for yourself or tournament manager
- **Copy Viewer Link** — copies the full URL to clipboard

Anyone with the viewer link or code can open the app, tap **Join Match**, enter the code, and watch live ball-by-ball updates with no page refresh needed.

---

## Join Match Codes

From the homepage tap **Join Match** and enter any of the three code types:

| Code | Prefix | What you see |
|---|---|---|
| **Viewer** | CRK | Read-only live scoreboard — full stats, commentary, partnerships |
| **Scorer** | SCR | Full scoring panel — score balls, select batsmen and bowlers |
| **Admin** | ADM | Live scoreboard + Admin bar to end match and view all codes |

---

## Display / Second Screen

Open `/display` (or click **Open Display Screen** from the scorer panel) on a second device, projector, or TV.

Displays:

- Live score, overs, run rate
- Current batsmen with stats
- Current bowler with figures
- Recent balls colour-coded by type
- Fall of wickets
- Over-by-over summary
- Commentary ticker at the bottom
- **Match code + live QR code** in the footer bar — viewers can scan directly from the screen

---

## Grounds Dashboard

Click **Grounds** on the homepage. This page connects to Firebase and shows every match currently being scored on any device in real time.

Each card shows:

- Match name (Team A vs Team B)
- Current score and overs
- Venue / ground name
- Status badge: **LIVE**, **BREAK**, **SETUP**, or **DONE**
- Match code

Click any card to open that match's live scoreboard directly.

> Matches appear automatically the moment a scorer starts syncing. No manual setup required.

---

## Tournament Module

### Creating a Tournament

Click **Tournament → New**. Fill in:

| Field | Description |
|---|---|
| **Tournament Name** | e.g. Premier League 2026 |
| **Organizer** | Club or person running the event |
| **Start / End Date** | Tournament duration |
| **Venue** | Main ground or city |
| **Format** | See formats below |
| **Description** | Optional notes |

---

### Tournament Formats

| Format | How it works | Best for |
|---|---|---|
| **League (Round Robin)** | Every team plays every other team once. Points decide standings. | 4–10 teams |
| **Knockout** | Single elimination. Lose once and you are out. | 4, 8, or 16 teams |
| **Round Robin** | Same as League — all teams play each other. | 4–8 teams |
| **League + Knockout** | League phase first, then top teams enter knockout (semis, final). | 6–12 teams |
| **Custom** | You control fixtures manually — no auto-generation. | Any size |

---

### Points System

| Result | Points Awarded |
|---|---|
| Win | 2 points |
| Loss | 0 points |
| Tie / No Result | 1 point each |

**NRR (Net Run Rate)** is calculated automatically after each result:

```
NRR = (Total runs scored − Total runs conceded) ÷ Matches played
```

Teams are ranked first by **points**, then by **NRR** if level on points.

---

### Adding Teams

Go to the **Teams** tab inside a tournament. Each team requires:

| Field | Description |
|---|---|
| **Name** | Full team name (e.g. Karachi Kings) |
| **Short Name** | 2–4 letter code shown on scoreboard (e.g. KK) |
| **Captain Name** | Optional — shown in team card |
| **Colour** | Jersey colour — shown as a dot on the points table |

> Add all teams **before** generating fixtures. Minimum 2 teams required.

---

### Fixtures

After adding teams click **Generate Fixtures** on the Teams tab. The app creates all match pairings automatically based on the selected format.

For each fixture you can edit:

| Field | Description |
|---|---|
| **Date & Time** | When the match is scheduled |
| **Ground** | Where it is being played |
| **Match Code** | Link this fixture to a live CricScore match (enter the CRK code) |
| **Runs Scored** | Enter the final scores after the match |
| **Result** | Select the winner — points table updates instantly |

Fixture stages are labelled automatically:

```
League → Quarter Final → Semi Final → Final
```

---

### Points Table

Updates automatically every time a fixture is marked completed and a winner is selected. Columns:

| Column | Meaning |
|---|---|
| **P** | Matches played |
| **W** | Wins |
| **L** | Losses |
| **T** | Ties |
| **Pts** | Total points |
| **NRR** | Net Run Rate |

---

## Data & Persistence

All match and tournament data is saved automatically:

| Storage | What is saved | Survives |
|---|---|---|
| **Local Storage** | All match data, ball-by-ball, tournament data | Refresh, tab close, browser restart, power loss |
| **Firebase** | Live match state for cross-device sync | Active while scorer page is open |

Data is **never** automatically deleted. It only disappears if:
- You manually delete a match from the homepage
- You clear browser data / site data

Tournament data is stored locally on the device that created it and does not sync to Firebase.

---

## Quick Reference

| Task | How to do it |
|---|---|
| Start a new match | Homepage → New Match |
| Share a live match | Scorer header → QR icon |
| Watch on another device | Homepage → Join Match → enter CRK code |
| Score from another device | Homepage → Join Match → enter SCR code |
| End a match as admin | Homepage → Join Match → enter ADM code → End Match |
| Open second screen / TV | Scorer header → External link icon |
| View all live grounds | Homepage → Grounds |
| Create a tournament | Homepage → Tournament → New |
| Generate tournament fixtures | Tournament → Teams tab → Generate Fixtures |
| Record a match result | Tournament → Fixtures tab → Edit fixture → Select winner |

---

*CricScore Pro V2 — Built for live cricket scoring across multiple devices and grounds.*
