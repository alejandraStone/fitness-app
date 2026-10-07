# Product Requirements Document (PRD)

**Product:** Fitness App
**Version:** V1
**Status:** Draft
**Type:** Mobile application
**Target platforms:** iOS and Android

---

# 1. Product Overview

Fitness App is a mobile application aimed mainly at women who train at the gym and want to have in a single place the organization of their routines and the tracking of their progress.

The product will progressively evolve into a personal fitness space that combines:

* workout planning and tracking;
* personal progression and evolution;
* exercise and routine inspiration;
* gym-related outfits and products;
* supplements and products of interest;
* and, later, intelligent and discovery features.

**V1 focuses exclusively on the routine and progression tracker.**

---

# 2. Problem

People who train use several separate apps to log weights/reps, save videos, outfits/products, and look up information. The goal is to unify them.

For V1, the specific problem we want to solve is:

> **Allow a user to create and maintain her routines, easily log what she completes, and view her progress over time.**

---

# 3. Target User

The application is aimed mainly at women who train at the gym and perform strength training.

The product must be useful both for:

* people who are starting to structure their workouts;
* experienced people who already have established routines;
* users who train following a fixed routine;
* users who modify their workouts frequently.

The user is not required to be training at the time of using the tracker.

---

# 4. Product Vision

The product vision is to become a reference application for organizing and managing a user's fitness life.

The application must evolve from a simple workout tracker into a **personal fitness space** where the user can:

1. organize her routines;
2. log and analyze her progress;
3. save inspiration;
4. discover exercises and routines;
5. save outfits and products;
6. organize supplements and products of interest;
7. and use intelligent tools to manage that information.

V1 is the first piece of this ecosystem.

---

# 5. V1 Goals

V1 must allow a user to:

* create an account;
* browse an exercise catalog;
* create her own routines;
* add exercises to a routine;
* configure and order the exercises within a routine;
* view her routines from a calendar;
* select a calendar day and choose one of her existing routines;
* log completed sets, reps and weight for that workout;
* log a workout during or after doing it;
* edit previously recorded workouts;
* view the history of an exercise;
* view her progression;
* identify her best records;
* use the main features without an Internet connection;
* synchronize data when a connection is available again.

---

# 6. Important Product Definition

## The tracker is NOT a real-time workout tracker

The user does not need to have the application open during the entire workout.

The concept is:

> **Select a day → choose a routine → perform the workout → log what was completed → view progression.**

The user can log the data:

* during the workout;
* immediately after;
* when arriving home;
* or later.

The system must treat the logged workout as a **historical record**, not as a session that needs to be monitored in real time.

The calendar is used to determine **the date on which the workout is being recorded**. It does not automatically assign a predefined routine to that date.

### Example

The user selects **Monday, September 28** in the calendar.

The application displays the routines that the user has previously created:

* Glutes + Quads
* Upper Body
* Full Body
* Leg Day

The user selects **Glutes + Quads**.

She can then record what she actually completed:

**Hip Thrust**

* 70 kg × 10
* 70 kg × 10
* 75 kg × 8
* 80 kg × 8

The application saves this as a workout record for **September 28**.

The user could have entered the information during the workout, immediately afterwards, or at a later time.

---

# 7. V1 Core Features

## 7.1 Exercises

The application will have an exercise catalog that the user can select from when creating her routines.

Each exercise will have at minimum:

* name;
* main muscle group;
* secondary muscle groups, if applicable.

The user will also be able to create **custom exercise variants** when she does not find a suitable option in the catalog.

These variants will be **private and will only be available to the user who created them**.

---

## 7.2 Routines

The user will be able to create and manage routines.

A routine will have:

* name;
* list of exercises;
* order of exercises;
* configuration of each exercise within the routine.

For each exercise, the user will be able to define a **target number of sets,  target rep range and current target weight** according to her training goals.

The target configuration will be defined according to the user's training goals.

Examples:

* Hip Thrust — 4 × 6–8 — 70 kg
* Romanian Deadlift — 3 × 8–10 — 40 kg

The **target weight** represents the weight the user is currently working with for that exercise. It is used together with the target sets and rep range to determine whether the current progression target has been achieved.

The routine will not include a mandatory rest time in V1.


The user will be able to:

* create a routine;
* edit it;
* delete it;
* duplicate it;
* add exercises;
* remove exercises;
* modify the order of exercises;
* configure the target sets and rep range for each exercise;
* configure the target weight for each exercise.

A routine is a **workout template**. It does not by itself represent a completed workout.

A routine does not have to be permanently assigned to a specific day of the week. The user chooses which routine to use when recording a workout.

---

## 7.3 Calendar

The application will provide a calendar through which the user can select the date of a workout.

When the user selects a date:

1. the application will display the routines previously created by the user;
2. the user will select the routine she wants to perform or record;
3. the application will allow her to enter the results of that workout.

The calendar must also allow the user to identify dates for which a workout has already been recorded.

The calendar represents **when the workout took place or is being recorded**, rather than assigning routines automatically to specific days.

The user must be able to select a date from the past and record or modify a workout for that date.

---

## 7.4 Workout Records

The user will be able to create a workout record by selecting a date and choosing one of her existing routines.

The routine provides the planned configuration for each exercise, including:

* target number of sets;
* target rep range;
* target weight.

The workout record contains the **actual performance**:

* selected calendar date;
* routine used;
* exercises performed;
* sets performed;
* weight used for each set;
* reps performed for each set.

The actual weight and reps are recorded independently for each set.

For example, if the routine specifies:

Hip Thrust — 4 × 6–8 — 70 kg

the user may record:

70 kg × 8
70 kg × 7
70 kg × 6
70 kg × 6

The recorded values represent what the user actually achieved.

It is not mandatory to complete an entire routine.

The user will be able to:

skip exercises;
perform fewer or more sets than planned;
perform reps outside the planned rep range;
record only some exercises;
record only some sets;
modify the recorded information later.

The system must preserve the workout as a historical record associated with its date.

The user may modify the workout record after it has been saved.

7.5 Progression

The application will use the user's actual recorded sets to show her progression over time.

Progression is based on actual performance, compared with the target configuration defined for each exercise in the routine.

Progression rule

When the user reaches the maximum number of repetitions defined in the target rep range for every planned set, the application will consider the current target achieved.

For example, if the routine defines:

Hip Thrust — 4 × 6–8 — 70 kg

The user may progress as follows:

Week 1: 70 kg × 8 / 7 / 6 / 6
Week 2: 70 kg × 8 / 8 / 7 / 7
Week 3: 70 kg × 8 / 8 / 8 / 7
Week 4: 70 kg × 8 / 8 / 8 / 8

Once the user completes 4 × 8 at 70 kg, the application will identify that the current target has been achieved and will suggest increasing the weight.

The application will not determine or recommend a specific new weight. The user decides how much weight to increase.

The suggestion may be presented as:

Target achieved. Consider increasing the weight.

The user can then update the target weight in her routine.

The progression cycle will then continue using the new target weight.

Progression information

At minimum, the user must be able to view:

target weight;
actual weight used;
reps performed;
date;
historical performance;
target configuration;
whether the current target has been achieved;
progression history.

The application may show this information through charts or other appropriate visual representations.

---

## 7.6 Personal Records

The application may automatically identify certain best records.

Examples:

* highest weight used;
* highest number of reps with a given weight;
* best historical performance according to a defined metric.

The exact definition of PR must be established before implementing this functionality.

---

# 8. Offline-first

The tracker must be designed to work without an Internet connection.

The absence of a connection **must not prevent the user from viewing her routines, selecting a date, or logging or modifying her workouts**.

Data must be stored locally and synchronized with the server when a connection exists.

## Offline

The user must be able to:

* view routines;
* create and edit routines;
* view exercises available locally;
* select calendar dates;
* log workouts;
* edit records;
* view her history;
* view her progression.

## Online

In addition to the previous features, the application may:

* synchronize data;
* make backups;
* obtain new data;
* update content.

Synchronization should be transparent to the user whenever possible.

---

# 9. User Experience Principles

The application must prioritize:

### Simplicity

Logging a workout should require the fewest reasonable number of steps.

### Clarity

The user must easily understand:

* which date she is viewing;
* which routine she has selected;
* what she has logged;
* what she did previously;
* how she has evolved.

### Progress-oriented

The main goal of the tracker is not to control the workout in real time, but to help the user **understand her progress over time**.

### Flexible logging

The application must not force the user to follow a routine strictly.

The user must be able to:

* modify exercises;
* skip exercises;
* log only part of a session;
* log data later;
* correct previous records.

### Offline reliability

Logging data must be reliable even with poor or no connection.

---

# 10. Out of Scope — V1

The following features are not part of V1:

* real-time workout tracking;
* mandatory rest timer;
* tempo tracking;
* virtual coach;
* automatic routine generation using AI;
* social network;
* community;
* saving Instagram/TikTok/YouTube content;
* outfit library;
* supplements;
* marketplace;
* product recommendations;
* paid training programs;
* nutrition features.

These features are part of possible future versions.

---

# 11. Future Product

After validating V1, the product may evolve into different areas.

## Inspiration

Allow saving external content from social media and other websites, such as:

* Instagram;
* TikTok;
* YouTube;
* Pinterest;
* other websites.

The content may be classified as:

* exercise;
* routine;
* outfit;
* product;
* supplement;
* general inspiration.

## Fitness Lifestyle

Later versions may allow users to organize:

* gym outfits;
* shoes and accessories;
* supplements;
* fitness products;
* products of interest;
* wishlists and purchase links.

## Intelligent Features

In later versions, AI may be used to:

* identify exercises in saved content;
* convert content into possible routines;
* automatically organize content;
* extract information from posts;
* help organize workouts.

Any automatically generated content must be reviewable and modifiable by the user.

---

# 12. Success Criteria for V1

V1 will be considered valid when a user can complete the following flow without help:

1. Create an account.
2. Create a routine.
3. Add several exercises.
4. Select a date from the calendar.
5. Select one of her existing routines for that date.
6. Perform the workout.
7. Log weight and reps during the workout or later.
8. View the logged workout.
9. Perform the same or another routine on another date.
10. Log new results.
11. View the evolution of an exercise.
12. Complete the main flow without an Internet connection.
13. Recover the data correctly after synchronizing.

The initial success of the product will be measured mainly by:

* users who complete their first logged workout;
* users who log workouts again;
* frequency of use;
* percentage of users who continue using the tracker after several weeks;
* most-used features;
* qualitative feedback from the first users.

---

# 13. Product Principles

These rules must be maintained throughout the product's evolution:

1. **The user's progress is the core of V1.**
2. **The application must not force training with the phone in real time.**
3. **Logging information must be fast and flexible.**
4. **The user's data must remain available offline.**
5. **Future features must not compromise the simplicity of the tracker.**
6. **AI must help the user, not replace her control over her data and routines.**
7. **New features must integrate into the existing ecosystem without turning the application into a set of disconnected tools.**

---

# 14. Glossary

**Exercise**
An individual movement or exercise that can be part of a routine.

**Custom Exercise Variant**
A private exercise variant created by a user when an appropriate exercise cannot be found in the application catalog.

**Routine**
A workout template composed of an ordered list of exercises and their configuration.

**Calendar Date**
The date selected by the user for viewing or recording a workout.

**Workout Record**
A record of a specific workout performed or recorded on a given date using a selected routine.

**Set**
A completed set of an exercise.

**Rep**
A completed repetition.

**Progression**
Evolution of the user's performance across her historical workout records.

**PR — Personal Record**
A user's best historical record according to a given metric.

**Offline-first**
An approach in which the application's main features do not depend on an active connection and data is synchronized later with the server.

---

# 15. Open Questions

The following decisions must be resolved before implementing the corresponding features:

* What exact configuration can be defined for each exercise within a routine?
* What exact metrics will the system use to calculate PRs?
* What parameters, besides weight and reps, may be logged?
* Can a workout be created without using an existing routine?
* How will synchronization conflicts be resolved?
* What data will be available locally from the first installation?
* What information may be modified after synchronizing?
* What metrics and charts will be shown initially?
* What authenti*
