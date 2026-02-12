# Formula Red – Driver Edition

Formula Red is a daily, skill-based racing game for Reddit where players actually drive the car, set one official lap per day, and compete on a live leaderboard that rolls into a full season championship.

---

## What is Formula Red?

Every day, a new race track is generated.

Players:
- configure their car,
- drive the track themselves,
- and submit one official lap.

That lap is ranked on the daily leaderboard and contributes to the season ranking.

Unlimited practice is allowed — but only one driven lap counts.

---

## Core Features

- New track every day  
- Real driving (not simulated results)  
- Car configuration affects real handling  
- Unlimited practice laps  
- One official lap per player per day  
- Live daily leaderboard  
- Season leaderboard with championship points  

---

## Game Loop

Open today’s race  
→ configure your car  
→ drive the track  
→ submit your official lap  
→ see your rank and the leaderboard

---

## Architecture

Formula Red is built as two connected parts.

### Web Driving Game (Client)
- Handles controls and driving physics
- Applies car configuration to handling
- Measures lap time and checkpoints

### Reddit Devvit App (League Controller)
- Generates the daily track
- Accepts official lap submissions
- Maintains daily leaderboards
- Manages season standings

---

## Rules

- One global track per day
- Unlimited practice laps
- Exactly one official lap per user per day
- Official laps cannot be re-submitted
- Daily results feed into a season system

---

## Car Configuration

Players configure:

- Downforce (low / balanced / high)
- Gear bias (acceleration / neutral / top speed)
- Tyres (soft / medium / hard)
- Driving style
- One tactical ability

These directly affect:

- grip
- stability
- acceleration
- top speed

---

## Track Rotation

Each day uses a deterministic track ID:

trackId = YYYYMMDD

All players race the same layout on the same day.

---

## Points System

1st – 25  
2nd – 18  
3rd – 15  
4th – 12  
5th – 10  
6th – 8  
7th – 6  
8th – 4  
9th – 2  
10th – 1  

---

## Fair Play

The backend validates:

- only one official submission per user per day
- correct daily track ID
- valid checkpoint order
- reasonable lap times

Only the first official submission is accepted.

---

## Getting Started (Developer)

1. Create the Devvit project.
2. Run the web racing client locally.
3. Connect the client to the Devvit submission endpoint.
4. Load today’s track from the Devvit API.
5. Submit official lap results to the backend.

---

## Vision

Formula Red brings a new kind of daily game to Reddit —  
a competitive, skill-based racing league where one real lap defines your place in a growing season.

A thousand practice laps teach the road.  
One lap writes your name.
