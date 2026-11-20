import type { Equipment } from '../types'
import type { ExerciseFamily } from './exerciseFamilies'

/**
 * English version of ./exerciseFamilies.ts — same keys, same number of steps
 * and tips. When a family is added or edited there, update it here too.
 */
export const EQUIPMENT_NOTES_EN: Record<Equipment, string> = {
  barre: 'Barbell: load both sides evenly, tighten the collars and ask for a spotter on heavy sets.',
  halteres: 'Dumbbells: pick a weight you control through the full range and set them down gently at the end of the set.',
  ez: 'EZ bar: the slightly angled grips are easier on the wrists and elbows.',
  machine:
    'Machine: adjust the seat and handles to your size before loading, so the working joint lines up with the machine’s pivot.',
  smith:
    'Smith machine: the bar runs on fixed rails. Set the height, rotate your wrists to unhook it and hook it back at the end of the set. Place your feet slightly forward or back depending on the exercise to stay in line.',
  poulie: 'Cable: choose the right attachment and keep the cable taut throughout the movement, without letting the stack rest.',
  poids_du_corps: 'Bodyweight: favor clean reps; add weight or a harder variation once it gets easy.',
}

export const FAMILIES_EN: Record<string, ExerciseFamily> = {
  /* -------------------------------- Chest -------------------------------- */
  press_flat: {
    steps: [
      'Lie on the bench, feet flat, shoulder blades squeezed together and chest up.',
      'Grip the weight slightly wider than shoulder width and unrack it, arms straight above your chest.',
      'Lower slowly to mid-chest, forearms vertical (breathe in).',
      'Press until your arms are straight without slamming the elbows into lockout (breathe out).',
    ],
    tips: [
      'Keep your glutes and shoulders on the bench.',
      'Don’t bounce the weight off your chest.',
      'Elbows at about 45-60° from your body, not flared to 90°.',
    ],
  },
  press_incline: {
    steps: [
      'Set the bench between 30° and 45°, settle your back, shoulder blades squeezed, feet planted.',
      'Grip the weight slightly wider than your shoulders and press it above your upper chest.',
      'Lower slowly to the upper chest, just below the collarbone (breathe in).',
      'Press back up to straight arms without lifting your back off the bench (breathe out).',
    ],
    tips: [
      'Above 45°, your shoulders do most of the work.',
      'Control the descent: about 2 seconds.',
      'Don’t over-arch your lower back.',
    ],
  },
  press_decline: {
    steps: [
      'Settle on the decline bench, legs locked in, back flat, shoulder blades squeezed.',
      'Grip the weight slightly wider than your shoulders and unrack it, arms straight.',
      'Lower to the bottom of your chest under control (breathe in).',
      'Press back up to straight arms (breathe out).',
    ],
    tips: [
      'Use a spotter: the decline makes re-racking the bar harder.',
      'Don’t stay head-down too long between sets.',
      'Keep your wrists straight, in line with your forearms.',
    ],
  },
  fly_flat: {
    steps: [
      'Lie on the bench with a dumbbell in each hand, arms straight above your chest, palms facing each other.',
      'Open your arms in a wide arc, elbows slightly bent, until you feel a stretch in your chest (breathe in).',
      'Bring the dumbbells back together as if hugging a big tree (breathe out).',
    ],
    tips: [
      'Keep your elbows slightly bent and fixed: it’s not a press.',
      'Don’t lower the dumbbells below shoulder level.',
      'Go lighter than for a press.',
    ],
  },
  fly_incline: {
    steps: [
      'Set the bench to about 30°, a dumbbell in each hand above your upper chest.',
      'Open your arms in an arc, elbows slightly bent, until your chest stretches (breathe in).',
      'Bring the dumbbells back together while squeezing your upper chest (breathe out).',
    ],
    tips: [
      'Move slowly, especially on the way down.',
      'Don’t let your shoulders creep up toward your ears.',
      'Choose a moderate weight to keep the full range.',
    ],
  },
  cable_fly_high: {
    steps: [
      'Set the pulleys high, take a handle in each hand and step forward, torso leaning slightly.',
      'Arms open, elbows slightly bent, stretch your chest (breathe in).',
      'Bring your hands down in front of your hips while squeezing your chest (breathe out).',
    ],
    tips: [
      'Keep your torso still; don’t use momentum.',
      'Elbows always slightly bent, never locked.',
      'Pause briefly when your hands meet.',
    ],
  },
  cable_fly_low: {
    steps: [
      'Set the pulleys low, take the handles and step forward, torso upright.',
      'Arms open by your sides, elbows slightly bent (breathe in).',
      'Raise your hands in an arc toward your upper chest while squeezing your chest (breathe out).',
    ],
    tips: [
      'It targets the upper chest: bring your hands up toward your chin.',
      'Don’t shrug your shoulders.',
      'Control the return without letting the stack slam.',
    ],
  },
  pec_deck: {
    steps: [
      'Adjust the seat so the handles are at chest height, back firmly against the pad.',
      'Grab the handles or place your forearms on the pads, elbows at shoulder height.',
      'Bring your arms together in front of you while squeezing your chest (breathe out).',
      'Open slowly until you feel the stretch, without letting the stack rest (breathe in).',
    ],
    tips: [
      'Keep your shoulders down and back.',
      'Don’t slam the weights between reps.',
      'Don’t push with your hands: think about bringing your elbows together.',
    ],
  },
  pushup: {
    steps: [
      'Hands on the floor slightly wider than your shoulders, body braced from head to heels.',
      'Bend your elbows until your chest almost touches the floor (breathe in).',
      'Push the floor away to return to straight arms (breathe out).',
    ],
    tips: [
      'Don’t let your hips sag or pike up.',
      'Elbows at about 45° from your body.',
      'Too hard? Do them on your knees or with your hands raised.',
    ],
  },
  chest_dips: {
    steps: [
      'Support yourself on the parallel bars, arms straight, torso leaning forward, legs crossed behind you.',
      'Bend your elbows and lower until you feel a stretch in your chest (breathe in).',
      'Press back up to straight arms, keeping your torso leaning forward (breathe out).',
    ],
    tips: [
      'The more you lean forward, the more your chest works.',
      'Don’t go lower than your shoulders tolerate without pain.',
      'Avoid swinging your legs.',
    ],
  },
  pullover_db: {
    steps: [
      'Lie across or along the bench, holding a dumbbell with both hands above your chest.',
      'Lower the dumbbell behind your head, arms almost straight, until your torso stretches (breathe in).',
      'Bring the dumbbell back above your chest, keeping your arms nearly straight (breathe out).',
    ],
    tips: [
      'Keep your ribs down: don’t arch your back.',
      'Use a comfortable range: stop if your shoulders pull.',
      'Moderate weight, slow movement.',
    ],
  },

  /* --------------------------------- Back --------------------------------- */
  pullup: {
    steps: [
      'Hang from the bar, hands shoulder-width apart or slightly wider, arms straight.',
      'Drive your elbows down and bring your chin above the bar (breathe out).',
      'Lower slowly to straight arms (breathe in).',
    ],
    tips: [
      'Start the movement by pulling your shoulder blades down, not just with your arms.',
      'Avoid swinging.',
      'Not strong enough yet? Use the assisted machine or a band.',
    ],
  },
  pullup_assisted: {
    steps: [
      'Set the counterweight (the heavier it is, the more the machine helps) and step onto the platform, knees or feet down.',
      'Grab the bar, arms straight, chest up.',
      'Drive your elbows down until your chin clears the bar (breathe out).',
      'Lower slowly to straight arms (breathe in).',
    ],
    tips: [
      'Gradually reduce the assistance over the weeks.',
      'Don’t drop down: control the descent.',
      'Keep your shoulders away from your ears.',
    ],
  },
  lat_pulldown: {
    steps: [
      'Adjust the thigh pad and grab the bar; sit down, torso leaning back slightly, chest up.',
      'Pull the bar to your upper chest, leading with your elbows (breathe out).',
      'Let it rise slowly until your arms are almost straight to stretch your back (breathe in).',
    ],
    tips: [
      'Don’t pull behind your neck.',
      'Don’t lean back too far to cheat.',
      'Think “elbows into your back pockets”.',
    ],
  },
  seated_row: {
    steps: [
      'Sit facing the low pulley, feet braced, knees slightly bent, back straight.',
      'Pull the handle to your lower belly while squeezing your shoulder blades (breathe out).',
      'Return slowly to straight arms, stretching your back without rounding it (breathe in).',
    ],
    tips: [
      'Your torso stays almost still: don’t rock back and forth.',
      'Keep your shoulders down.',
      'Pause when your shoulder blades are squeezed.',
    ],
  },
  barbell_row: {
    steps: [
      'Stand with feet hip-width apart, hinge your torso to about 45°, back flat, weight held at arm’s length.',
      'Pull the weight to your lower belly, leading with your elbows (breathe out).',
      'Lower under control to straight arms (breathe in).',
    ],
    tips: [
      'Keep your back flat throughout.',
      'Don’t stand up between reps.',
      'Stick to a weight you can move without momentum.',
    ],
  },
  one_arm_row: {
    steps: [
      'Put one knee and one hand on the bench, back flat; the other hand holds the dumbbell, arm straight.',
      'Pull the dumbbell toward your hip, keeping your elbow close to your body (breathe out).',
      'Lower slowly, stretching your back (breathe in). Do all your reps, then switch sides.',
    ],
    tips: [
      'Don’t twist your torso to lift the dumbbell.',
      'Think about pulling with your elbow, not your hand.',
      'Keep your neck in line with your back.',
    ],
  },
  machine_row: {
    steps: [
      'Adjust the seat and pad so the handles are at torso height, chest firmly against the pad.',
      'Grab the handles and pull them toward you while squeezing your shoulder blades (breathe out).',
      'Return slowly to a stretch without losing tension (breathe in).',
    ],
    tips: [
      'Keep your chest on the pad.',
      'Keep your shoulders down, away from your ears.',
      'Slow down the return: your back works there too.',
    ],
  },
  tbar_row: {
    steps: [
      'Straddle the bar, hinge your torso to 45°, back flat, and grab the handle.',
      'Pull the weight to your upper belly while squeezing your shoulder blades (breathe out).',
      'Lower slowly to straight arms (breathe in).',
    ],
    tips: [
      'Keep your knees slightly bent.',
      'Don’t move your torso to help.',
      'Avoid rounding your lower back.',
    ],
  },
  straight_arm: {
    steps: [
      'Facing the high pulley, grab the bar or rope with straight arms, torso leaning slightly, back straight.',
      'Bring your hands down to your thighs, keeping your arms almost straight (breathe out).',
      'Let them rise slowly until your back stretches (breathe in).',
    ],
    tips: [
      'Elbows stay slightly bent and fixed.',
      'Don’t let your torso follow the movement.',
      'Imagine “sweeping” the weight down with your back.',
    ],
  },
  back_ext: {
    steps: [
      'Rest your hips on the pad of the 45° bench, ankles locked in, arms crossed over your chest.',
      'Lower your torso, keeping your back straight (breathe in).',
      'Come back up until your body is in a straight line, without arching (breathe out).',
    ],
    tips: [
      'Don’t go past a straight line at the top.',
      'Move slowly, without jerking.',
      'Hold a plate against your chest to make it harder.',
    ],
  },
  deadlift: {
    steps: [
      'Feet hip-width apart, bar over mid-foot; grip it with hands just outside your legs, back flat.',
      'Brace your belly, tighten your back, then push the floor away with your legs (breathe out at the top).',
      'Finish standing tall, hips locked, without leaning back.',
      'Lower by pushing your hips back, keeping the bar close to your legs.',
    ],
    tips: [
      'Keep your back flat from start to finish.',
      'The bar stays against your legs.',
      'Start light to learn the movement.',
    ],
  },
  rdl: {
    steps: [
      'Stand with the bar or dumbbells in front of your thighs, legs almost straight, knees slightly bent.',
      'Push your hips back, keeping your back flat, and slide the weight down your legs (breathe in).',
      'As soon as you feel the stretch in your hamstrings, come up by driving your hips forward (breathe out).',
    ],
    tips: [
      'The movement comes from the hips, not the back.',
      'Keep the weight very close to your legs.',
      'Don’t go lower than your flexibility allows.',
    ],
  },
  shrug: {
    steps: [
      'Stand with your arms straight by your sides, weight held at each side or in front of your thighs.',
      'Shrug your shoulders straight up toward your ears (breathe out).',
      'Pause at the top, then lower slowly (breathe in).',
    ],
    tips: [
      'Don’t roll your shoulders.',
      'Keep your arms straight: your traps do the work, not your biceps.',
      'Look straight ahead, neck neutral.',
    ],
  },

  /* ------------------------------ Shoulders ------------------------------ */
  ohp: {
    steps: [
      'Standing or seated, back straight, weight at shoulder height, forearms vertical, abs tight.',
      'Press the weight overhead until your arms are straight (breathe out).',
      'Lower slowly back to your shoulders (breathe in).',
    ],
    tips: [
      'Don’t arch your lower back: squeeze your abs and glutes.',
      'Move your head slightly forward once the weight passes it.',
      'Avoid pushing with your legs (unless doing a push press).',
    ],
  },
  arnold: {
    steps: [
      'Seated, dumbbells in front of your shoulders, palms facing you, elbows in front.',
      'Press up while opening your elbows and turning your palms forward, finishing with straight arms (breathe out).',
      'Lower while reversing the rotation back to the start position (breathe in).',
    ],
    tips: [
      'Smooth movement, no jerking.',
      'Use lighter dumbbells than for a regular press.',
      'Keep your back against the backrest.',
    ],
  },
  lateral_raise: {
    steps: [
      'Stand with a weight in each hand by your sides, elbows very slightly bent.',
      'Raise your arms out to the sides up to shoulder height (breathe out).',
      'Lower slowly without letting the weight drop (breathe in).',
    ],
    tips: [
      'Lead with your elbows, not your hands.',
      'Don’t go above shoulder level.',
      'Avoid swinging your torso.',
    ],
  },
  front_raise: {
    steps: [
      'Stand with dumbbells or a bar in front of your thighs, arms almost straight.',
      'Raise the weight in front of you up to eye level (breathe out).',
      'Lower slowly (breathe in).',
    ],
    tips: [
      'Don’t swing your torso.',
      'Stick to light to moderate weights.',
      'Shoulders stay down, away from your ears.',
    ],
  },
  rear_delt: {
    steps: [
      'Hinge forward with a flat back (or sit facing the machine), weight in your hands, arms almost straight.',
      'Open your arms out to the sides while squeezing your shoulder blades (breathe out).',
      'Return slowly to the start position (breathe in).',
    ],
    tips: [
      'Elbows slightly bent and fixed.',
      'Go light: the rear delts are small.',
      'Don’t lift your torso to help.',
    ],
  },
  face_pull: {
    steps: [
      'Set the pulley at face height with a rope, grab it palms facing each other and step back.',
      'Pull the rope toward your face, flaring your elbows out (breathe out).',
      'Return slowly to straight arms (breathe in).',
    ],
    tips: [
      'Elbows at hand height or higher.',
      'Keep the weight light and the movement clean.',
      'Great for posture and shoulder health.',
    ],
  },
  upright_row: {
    steps: [
      'Stand with a bar or cable in front of your thighs, grip shoulder-width or slightly wider.',
      'Raise the weight along your body to mid-chest, elbows high (breathe out).',
      'Lower slowly (breathe in).',
    ],
    tips: [
      'Don’t raise your elbows above your shoulders if it pinches.',
      'Wider grip = less stress on the shoulders.',
      'Keep your back straight.',
    ],
  },

  /* -------------------------------- Biceps -------------------------------- */
  curl: {
    steps: [
      'Stand holding the weight, palms forward, elbows against your sides.',
      'Bend your elbows to bring the weight up toward your shoulders (breathe out).',
      'Lower slowly to straight arms (breathe in).',
    ],
    tips: [
      'Don’t swing your torso to lift the weight.',
      'Elbows stay still by your sides.',
      'Lower all the way to work the full range.',
    ],
  },
  hammer: {
    steps: [
      'Stand with a dumbbell in each hand, palms facing your thighs (neutral grip), elbows by your sides.',
      'Curl the dumbbells toward your shoulders without turning your wrists (breathe out).',
      'Lower slowly (breathe in).',
    ],
    tips: [
      'Wrists straight throughout.',
      'Don’t swing your torso.',
      'Can be done alternating arms.',
    ],
  },
  incline_curl: {
    steps: [
      'Sit on a bench inclined to 45-60°, back against it, arms hanging at your sides with a dumbbell each.',
      'Curl the dumbbells up by bending your elbows without moving them forward (breathe out).',
      'Lower slowly to a full biceps stretch (breathe in).',
    ],
    tips: [
      'Keep your elbows under your shoulders.',
      'Moderate weight: the stretch makes it demanding.',
      'Keep your shoulders against the backrest.',
    ],
  },
  preacher: {
    steps: [
      'Sit at the preacher bench, arms flat on the pad, chest against the support, and grab the weight.',
      'Curl the weight toward your shoulders without lifting your arms off the pad (breathe out).',
      'Lower slowly to almost straight arms (breathe in).',
    ],
    tips: [
      'Don’t snap your elbows into lockout at the bottom.',
      'No momentum: move slowly.',
      'Set the seat so your armpits rest at the top of the pad.',
    ],
  },
  cable_curl: {
    steps: [
      'Facing the low pulley, grab the bar or rope, elbows against your sides.',
      'Bend your elbows to curl up toward your shoulders (breathe out).',
      'Lower slowly, keeping the cable taut (breathe in).',
    ],
    tips: [
      'The pulley gives constant tension: don’t release it at the bottom.',
      'Don’t lean your torso back.',
      'Keep your wrists straight.',
    ],
  },
  concentration: {
    steps: [
      'Sit on a bench, elbow braced against the inside of your thigh, dumbbell in hand, arm straight.',
      'Curl the dumbbell toward your shoulder, turning your wrist slightly (breathe out).',
      'Lower slowly to a straight arm (breathe in). Do all your reps, then switch arms.',
    ],
    tips: [
      'Your upper arm stays still; only the forearm moves.',
      'Pause for a second at the top to squeeze.',
      'Don’t lean your torso to cheat.',
    ],
  },

  /* ------------------------------- Triceps ------------------------------- */
  pushdown: {
    steps: [
      'Facing the high pulley, grab the rope or bar, elbows against your sides, forearms horizontal.',
      'Push down until your arms are fully straight (breathe out).',
      'Let it rise slowly until your forearms are horizontal again (breathe in).',
    ],
    tips: [
      'Your elbows don’t move: only the forearms work.',
      'With the rope, spread your hands at the bottom for a stronger squeeze.',
      'Don’t lean over the bar to push.',
    ],
  },
  skullcrusher: {
    steps: [
      'Lie on the bench, EZ bar or dumbbells above your chest, arms straight.',
      'Bend your elbows to lower the weight toward your forehead or behind your head (breathe in).',
      'Straighten your arms to come back up, elbows fixed (breathe out).',
    ],
    tips: [
      'Elbows point at the ceiling without flaring out.',
      'Control the descent to protect your elbows.',
      'Start with a light weight.',
    ],
  },
  overhead_ext: {
    steps: [
      'Standing or seated, hold a dumbbell with both hands overhead, arms straight.',
      'Bend your elbows to lower the dumbbell behind your head (breathe in).',
      'Straighten your arms to come back up, elbows close to your ears (breathe out).',
    ],
    tips: [
      'Keep your elbows tucked in, not flared.',
      'Don’t arch your back: abs tight.',
      'Slow, controlled movement.',
    ],
  },
  close_grip: {
    steps: [
      'Lie on the bench and grip the bar with hands about shoulder-width apart.',
      'Lower the bar to your lower chest, elbows close to your body (breathe in).',
      'Press until your arms are straight, keeping your elbows tucked (breathe out).',
    ],
    tips: [
      'Don’t bring your hands too close together: your wrists will suffer.',
      'Elbows stay close to your body.',
      'Keep your shoulder blades squeezed on the bench.',
    ],
  },
  bench_dips: {
    steps: [
      'Hands on the edge of a bench behind you, legs straight or bent in front of you.',
      'Bend your elbows and lower to about 90° (breathe in).',
      'Push back up until your arms are straight (breathe out).',
    ],
    tips: [
      'Keep your back close to the bench.',
      'Don’t go too low if your shoulders pull.',
      'Bend your knees to make it easier; add a weight on your thighs to make it harder.',
    ],
  },
  kickback: {
    steps: [
      'Hinge forward, back flat, elbow bent to 90° against your side, dumbbell in hand.',
      'Extend your arm back until it lines up with your back (breathe out).',
      'Return slowly to 90° (breathe in). Switch arms after the set.',
    ],
    tips: [
      'Your upper arm stays still.',
      'Light weight, maximum squeeze at the top.',
      'Don’t swing your torso.',
    ],
  },
  tri_machine: {
    steps: [
      'Adjust the seat so your elbows line up with the machine’s pivot, back against the pad.',
      'Push the handles or lever until your arms are straight (breathe out).',
      'Return slowly until your forearms come back up (breathe in).',
    ],
    tips: [
      'Keep your elbows close to your body.',
      'Keep your back against the backrest.',
      'Move slowly, without snapping your elbows into lockout.',
    ],
  },
  bar_dips_triceps: {
    steps: [
      'Support yourself on the parallel bars, arms straight, torso upright, legs crossed behind you.',
      'Bend your elbows, tucked along your body, down to about 90° (breathe in).',
      'Press back up to straight arms without swinging (breathe out).',
    ],
    tips: [
      'Keep your torso vertical to target the triceps.',
      'Don’t let your shoulders creep up toward your ears.',
      'Add weight only once 12 clean reps feel easy.',
    ],
  },
  leg_raise_floor: {
    steps: [
      'Lie on your back, hands under your glutes or by your sides, legs straight.',
      'Raise your legs to vertical while keeping your lower back pressed to the floor (breathe out).',
      'Lower slowly without touching the floor (breathe in).',
    ],
    tips: [
      'If your lower back arches, bend your knees.',
      'Move slowly, especially on the way down.',
      'Keep breathing; don’t hold your breath.',
    ],
  },

  /* --------------------------------- Legs --------------------------------- */
  squat: {
    steps: [
      'Feet shoulder-width apart, toes turned out slightly, weight stable on your upper back, abs tight.',
      'Lower by pushing your hips back and bending your knees, back straight (breathe in).',
      'Go down at least until your thighs are parallel to the floor.',
      'Drive through your heels and mid-foot to stand up (breathe out).',
    ],
    tips: [
      'Knees follow your toes; don’t let them cave in.',
      'Keep your eyes forward and your back flat.',
      'Heels stay on the floor.',
    ],
  },
  front_squat: {
    steps: [
      'Bar resting on the front of your shoulders, elbows high, feet shoulder-width apart.',
      'Lower while keeping your torso very upright and your elbows high (breathe in).',
      'Stand up by driving through your feet (breathe out).',
    ],
    tips: [
      'If your elbows drop, the bar rolls: lighten the load.',
      'It needs wrist and ankle mobility: progress gradually.',
      'Keep your knees in line with your feet.',
    ],
  },
  goblet: {
    steps: [
      'Hold a dumbbell vertically against your chest, feet slightly wider than your shoulders.',
      'Squat down between your legs, torso upright, elbows inside your knees (breathe in).',
      'Stand up by driving through your feet (breathe out).',
    ],
    tips: [
      'A great exercise to learn the squat.',
      'Keep your heels on the floor.',
      'The dumbbell stays against your chest.',
    ],
  },
  leg_press: {
    steps: [
      'Sit with your back and hips firmly against the seat, feet shoulder-width apart in the middle of the platform.',
      'Release the safeties and lower by bending your knees to about 90° (breathe in).',
      'Push with your whole foot to straighten your legs without locking your knees (breathe out).',
    ],
    tips: [
      'Don’t let your hips lift off the seat at the bottom.',
      'Knees follow the direction of your feet.',
      'Feet high = more glutes and hamstrings; feet low = more quads.',
    ],
  },
  hack_squat: {
    steps: [
      'Place your shoulders under the pads, back flat, feet shoulder-width apart on the platform.',
      'Release and lower by bending your knees to about 90° (breathe in).',
      'Drive through your feet to come back up (breathe out).',
    ],
    tips: [
      'Keep your whole back against the backrest.',
      'Don’t lock your knees at the top.',
      'Feet lower to target the quads more.',
    ],
  },
  leg_ext: {
    steps: [
      'Adjust the backrest and the roller so it sits on your lower shins, knees in line with the pivot.',
      'Straighten your legs fully (breathe out).',
      'Lower slowly without letting the stack rest (breathe in).',
    ],
    tips: [
      'Don’t swing your torso.',
      'Pause at the top to squeeze your quads.',
      'Reasonable weight: knees don’t like jerky reps.',
    ],
  },
  leg_curl_lying: {
    steps: [
      'Lie face down, roller just above your heels, knees in line with the pivot.',
      'Bend your legs to bring your heels toward your glutes (breathe out).',
      'Lower slowly until your legs are almost straight (breathe in).',
    ],
    tips: [
      'Keep your hips on the bench.',
      'Don’t arch your back.',
      'Control the return.',
    ],
  },
  leg_curl_seated: {
    steps: [
      'Sit with your back against the pad, thigh pad on your thighs, roller behind your ankles.',
      'Bend your legs, pulling your heels down and back (breathe out).',
      'Return slowly to straight legs (breathe in).',
    ],
    tips: [
      'Adjust the thigh pad so your thighs are locked in.',
      'Keep your glutes on the seat.',
      'Keep a slow pace.',
    ],
  },
  lunge: {
    steps: [
      'Stand holding the weight in your hands or on your back, then take a big step forward.',
      'Bend both knees until your back knee nearly touches the floor (breathe in).',
      'Push through your front leg to stand back up (breathe out).',
    ],
    tips: [
      'Torso upright, hips stable.',
      'Don’t let your front knee cave in.',
      'Think about going straight down, not forward.',
    ],
  },
  walking_lunge: {
    steps: [
      'Stand with a weight in each hand and take a big step forward.',
      'Lower until your back knee nearly touches the floor (breathe in).',
      'Push off your front leg and bring the back leg forward into the next step (breathe out).',
    ],
    tips: [
      'Look straight ahead, torso upright.',
      'Take steps long enough to keep your front knee over your foot.',
      'Give yourself room: about ten meters.',
    ],
  },
  bulgarian: {
    steps: [
      'Place your back foot on a bench behind you, the other leg in front, weight in your hands.',
      'Bend your front leg until your thigh is parallel to the floor (breathe in).',
      'Drive through your front foot to come up (breathe out). Switch legs after the set.',
    ],
    tips: [
      'Place your front foot far enough forward to keep your knee over your ankle.',
      'Torso upright.',
      'Start without weight to find your balance.',
    ],
  },
  good_morning: {
    steps: [
      'Bar on your upper back, feet shoulder-width apart, knees slightly bent.',
      'Hinge forward by pushing your hips back, back flat, until you are almost parallel to the floor (breathe in).',
      'Come back up by driving your hips forward (breathe out).',
    ],
    tips: [
      'Start very light: it’s a technical exercise.',
      'Your back stays flat, never rounded.',
      'The movement comes from the hips.',
    ],
  },
  step_up: {
    steps: [
      'Facing a bench or step, put one foot on it, weight in your hands.',
      'Push through the raised leg to step up until you stand on the bench (breathe out).',
      'Step down slowly with control (breathe in). Switch legs after the set.',
    ],
    tips: [
      'Don’t push off with the leg on the floor.',
      'Choose a bench at about knee height.',
      'Keep your torso upright.',
    ],
  },
  calf_standing: {
    steps: [
      'Stand with your shoulders under the pads or a bar on your back, balls of your feet on the edge of the platform.',
      'Lower your heels to stretch your calves (breathe in).',
      'Rise onto your toes as high as possible (breathe out) and pause.',
    ],
    tips: [
      'Full range: stretch at the bottom, squeeze at the top.',
      'Slow movement, no bouncing.',
      'Legs straight but knees not locked.',
    ],
  },
  calf_seated: {
    steps: [
      'Sit with your knees under the pads, balls of your feet on the platform.',
      'Lower your heels to stretch (breathe in).',
      'Rise onto your toes, squeezing hard (breathe out), and pause at the top.',
    ],
    tips: [
      'It mainly targets the soleus, under the visible calf.',
      'Slow, full movement.',
      'You can go heavier than standing: high reps work well.',
    ],
  },
  calf_press: {
    steps: [
      'Sit in the leg press, legs almost straight, balls of your feet at the bottom of the platform.',
      'Lower your heels to stretch your calves (breathe in).',
      'Push through the balls of your feet (breathe out) and pause at the top.',
    ],
    tips: [
      'Knees stay almost straight, without locking them.',
      'Move only at the ankles.',
      'Control the weight at the bottom.',
    ],
  },
  adductor: {
    steps: [
      'Sit with your back against the pad, thighs apart, pads against the inside of your knees.',
      'Squeeze your legs together (breathe out).',
      'Open slowly back out (breathe in).',
    ],
    tips: [
      'Don’t let the stack slam.',
      'Set the starting width to a comfortable range.',
      'Keep your back against the pad.',
    ],
  },
  abductor: {
    steps: [
      'Sit with your back against the pad, legs together, pads against the outside of your knees.',
      'Open your legs by pushing outward (breathe out).',
      'Return slowly under control (breathe in).',
    ],
    tips: [
      'Lean your torso forward slightly to better target the glutes.',
      'Keep your hips stable.',
      'Pause briefly with your legs open.',
    ],
  },

  /* -------------------------------- Glutes -------------------------------- */
  hip_thrust: {
    steps: [
      'Sit on the floor, upper back against a bench, weight resting on your hips, feet flat and hip-width apart.',
      'Drive through your feet and raise your hips until your shoulders, hips and knees line up (breathe out).',
      'Squeeze your glutes at the top, then lower slowly (breathe in).',
    ],
    tips: [
      'Chin tucked, eyes forward.',
      'Don’t arch your lower back at the top: keep your pelvis tucked.',
      'Shins are vertical at the top of the movement.',
    ],
  },
  glute_bridge: {
    steps: [
      'Lie on your back, knees bent, feet flat close to your glutes.',
      'Raise your hips by driving through your heels until your shoulders, hips and knees line up (breathe out).',
      'Squeeze your glutes, then lower slowly (breathe in).',
    ],
    tips: [
      'Don’t arch your lower back.',
      'Push through your heels, not your toes.',
      'Add a dumbbell on your hips to progress.',
    ],
  },
  glute_kickback: {
    steps: [
      'Brace yourself in front of the low pulley (ankle strap) or on the machine, torso leaning slightly forward.',
      'Push your leg back while squeezing your glute (breathe out).',
      'Return slowly without losing tension (breathe in). Switch legs after the set.',
    ],
    tips: [
      'Don’t arch your back to lift your leg higher.',
      'Keep your hips square to the floor.',
      'Squeeze hard at the top of the movement.',
    ],
  },

  /* --------------------------------- Abs --------------------------------- */
  crunch: {
    steps: [
      'Lie on your back, knees bent, feet on the floor, hands by your temples.',
      'Curl your upper back to lift your shoulders off the floor (breathe out).',
      'Lower slowly without fully resting your head (breathe in).',
    ],
    tips: [
      'Don’t pull on your neck with your hands.',
      'Think about bringing your ribs toward your pelvis.',
      'Short but controlled movement.',
    ],
  },
  cable_crunch: {
    steps: [
      'Kneel facing the high pulley, rope held on each side of your head.',
      'Curl your torso down, bringing your elbows toward your knees (breathe out).',
      'Come back up slowly, keeping the tension (breathe in).',
    ],
    tips: [
      'Hips stay fixed: the movement comes from your torso.',
      'Round your back; don’t just bend at the hips.',
      'Moderate weight to keep it clean.',
    ],
  },
  hanging_leg_raise: {
    steps: [
      'Hang from the bar, arms straight, legs straight or slightly bent.',
      'Raise your legs to horizontal or higher while curling your pelvis up (breathe out).',
      'Lower slowly without swinging (breathe in).',
    ],
    tips: [
      'Avoid momentum: keep your upper body still.',
      'Curl your pelvis at the end of the movement to work the abs.',
      'Too hard? Bend your knees.',
    ],
  },
  knee_raise: {
    steps: [
      'Hang from the bar or use the captain’s chair, back against the pad.',
      'Raise your knees toward your chest while curling your pelvis (breathe out).',
      'Lower slowly (breathe in).',
    ],
    tips: [
      'Don’t swing.',
      'Pause for a second at the top.',
      'Keep your shoulders away from your ears.',
    ],
  },
  plank: {
    steps: [
      'Rest on your forearms and toes, elbows under your shoulders.',
      'Line up your head, back and legs, abs and glutes tight.',
      'Hold the position while breathing normally.',
    ],
    tips: [
      'Don’t let your hips sag or pike up.',
      'Look at the floor, neck neutral.',
      'Start with 20 to 30 seconds and build up.',
    ],
  },
  side_plank: {
    steps: [
      'Lie on your side, propped on one forearm, elbow under your shoulder, legs straight.',
      'Lift your hips to line up your head, torso and legs.',
      'Hold the position while breathing, then switch sides.',
    ],
    tips: [
      'Keep your hips up; don’t let them drop.',
      'Make it easier by resting your knee on the floor.',
      'Don’t rotate your torso forward or back.',
    ],
  },
  russian_twist: {
    steps: [
      'Sit with knees bent, torso leaning back, feet on the floor or raised, hands together (or holding a weight).',
      'Rotate your torso to one side, bringing your hands next to your hip (breathe out).',
      'Come back to the center, then rotate to the other side.',
    ],
    tips: [
      'Keep your back straight; don’t round it.',
      'Rotate with your torso, not just your arms.',
      'Feet on the floor to make it easier.',
    ],
  },
  ab_wheel: {
    steps: [
      'Kneel and hold the wheel with both hands under your shoulders, back slightly rounded.',
      'Roll forward, keeping your core braced, until your torso is almost horizontal (breathe in).',
      'Roll the wheel back toward your knees by contracting your abs (breathe out).',
    ],
    tips: [
      'Only roll out as far as you can keep your lower back flat.',
      'Never arch your back.',
      'Start with a short range, against a wall if needed.',
    ],
  },
  ab_machine: {
    steps: [
      'Adjust the seat and pad, grab the handles, back against the pad.',
      'Curl your torso forward while contracting your abs (breathe out).',
      'Return slowly to the start position (breathe in).',
    ],
    tips: [
      'Don’t pull with your arms: think about bringing your ribs toward your pelvis.',
      'Slow movement, no momentum.',
      'Keep your hips planted on the seat.',
    ],
  },
  bicycle: {
    steps: [
      'Lie on your back, hands by your temples, legs off the floor.',
      'Bring one elbow toward the opposite knee while extending the other leg (breathe out).',
      'Alternate sides in a pedaling motion.',
    ],
    tips: [
      'Rotate your torso, not just your elbows.',
      'Keep your lower back on the floor.',
      'Slow, controlled pace.',
    ],
  },
  woodchopper: {
    steps: [
      'Stand side-on to the high pulley, grab the handle with both hands, feet hip-width apart.',
      'Pull diagonally down from the high shoulder to the opposite hip, rotating your torso (breathe out).',
      'Return slowly to the start position (breathe in). Switch sides after the set.',
    ],
    tips: [
      'Arms stay almost straight: the movement comes from your core.',
      'Pivot on your feet, hips stable.',
      'Moderate weight.',
    ],
  },

  /* ------------------------------- Forearms ------------------------------- */
  wrist_curl: {
    steps: [
      'Sit with your forearms on your thighs or a bench, palms up, weight at your fingertips.',
      'Flex your wrists to lift the weight (breathe out).',
      'Lower slowly, letting the bar roll down to your fingers (breathe in).',
    ],
    tips: [
      'Forearms stay flat.',
      'Light weight, lots of reps.',
      'Full range, no jerking.',
    ],
  },
  reverse_wrist: {
    steps: [
      'Sit with your forearms on your thighs or a bench, palms down, weight in hand.',
      'Raise your wrists to lift the weight (breathe out).',
      'Lower slowly (breathe in).',
    ],
    tips: [
      'Choose a very light weight: these muscles are small.',
      'Your forearms don’t move.',
      'Don’t cheat with your elbows.',
    ],
  },
  farmers: {
    steps: [
      'Hold a heavy dumbbell in each hand, arms by your sides, shoulders down.',
      'Walk at a steady pace, torso upright, eyes forward.',
      'Keep going for the planned time or distance, then set the weights down under control.',
    ],
    tips: [
      'Grip the handles as hard as you can.',
      'Don’t lean to one side.',
      'Take short, steady steps.',
    ],
  },

  /* -------------------------------- Cardio -------------------------------- */
  cardio_rower: {
    steps: [
      'Sit down, strap your feet in and grab the handle with straight arms.',
      'Push with your legs, then lean your torso back, then pull the handle to your belly.',
      'Return in reverse order: arms, torso, then legs.',
    ],
    tips: [
      'Your legs do most of the work.',
      'Keep your back straight.',
      'Steady stroke rate.',
    ],
  },
  cardio_bike: {
    steps: [
      'Set the saddle so your leg is almost straight at the bottom of the pedal stroke.',
      'Pedal at a steady cadence, back straight, hands relaxed.',
      'Adjust the resistance to the intensity you want.',
    ],
    tips: [
      'Don’t tense your shoulders.',
      'Breathe steadily.',
      'Warm up for a few minutes before increasing the resistance.',
    ],
  },
  cardio_treadmill: {
    steps: [
      'Step onto the treadmill, clip on the safety key and start at a low speed.',
      'Build up gradually to your pace, torso upright, eyes forward.',
      'Slow down at the end of the session to recover.',
    ],
    tips: [
      'Avoid holding the rails while running.',
      'Land under your center of gravity, not too far in front.',
      'Keep your breathing steady.',
    ],
  },
}
