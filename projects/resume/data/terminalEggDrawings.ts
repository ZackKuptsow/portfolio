/**
 * The typed shell's drawings, in plain ASCII: the site's font has no block characters, and a
 * fallback font would misalign them. Drawn for the row height the shell prints them at, 1.35.
 */

export const TRIFORCE_DRAWING = [
  '         #',
  '        ###',
  '       #####',
  '      #######',
  '     #########',
  '    #         #',
  '   ###       ###',
  '  #####     #####',
  ' #######   #######',
  '######### #########',
] as const

export const VAULT_DRAWING = [
  '              ..+++######+++..',
  '          .+#######++###########+.',
  '       .####++.     ######.  .++####.',
  '     +###+.       .###+..+#      .+###+',
  '   .###+         +###.    #+        +###.',
  '  +###.        +####.     ##.        .###+',
  ' +###        .####+       ###          ###+',
  '.###       .#####+        +##.          ###.',
  '###.      +#####.         +###          .###',
  '###     +######           .###+          ###',
  '###   .######+             ####          ###',
  '###. +######.              ####+        .###',
  '.##########                #####.       ###.',
  ' +#######+                 +#####      ###+',
  '  +######                  +#####.   .###+',
  '   .######+                .######  +###.',
  '     +#######+.             ##########+',
  '       .##########++++++++##########.',
  '          .+####################+.',
  '              ..+++######+++..',
] as const

export const CIGARETTE_IN_ASHTRAY_DRAWING = [
  '                      )',
  '                     (',
  '                      )',
  '       ______________',
  '      |::::|         |%~',
  '      |::::|_________|%~',
  '  ____________________________',
  '  \\__________________________/',
] as const

export const SUIT_DRAWING = [
  '       ___    ___',
  '    __/   \\/\\/   \\__',
  '   /  \\    \\/    /  \\',
  '  /    \\   ||   /    \\',
  ' /  /\\  \\  ||  /  /\\  \\',
  '/__/  \\  \\ || /  /  \\__\\',
  '      |   \\||/   |',
  '      |    ||  o |',
  '      |    \\/  o |',
  '      |__________|',
] as const

/** An original little robot, stuck at the bottom of a staircase. */
export const ROBOT_AT_THE_STAIRS_DRAWING = [
  '                                  ______',
  '                            _____|',
  '                      _____|',
  '                _____|',
  '    _|_   _____|',
  '   [o o] |',
  '   |___| |',
  '    O O  |',
  '  _______|',
] as const

const CHEST_BODY = [
  '  |________[]_______|',
  '  |                 |',
  '  |_________________|',
] as const

/** A treasure chest of no particular game, shut. */
export const CHEST_CLOSED = [
  '    _______________',
  '   /               \\',
  '  /_________________\\',
  ...CHEST_BODY,
] as const

/** The same chest a column to the right, for it to shake between the two. */
export const CHEST_SHAKING = CHEST_CLOSED.map((row) => ` ${row}`)

/** The lid lifting, and light getting out. */
export const CHEST_AJAR = [
  '    _______________',
  '   /               \\',
  '  /_________________\\',
  "   '  .  '  .  '  .",
  ...CHEST_BODY,
] as const

/** The lid thrown back, and the light all the way out. */
export const CHEST_OPEN = [
  '      \\    |    /',
  '   .   \\   |   /   .',
  '       _________',
  '    __/         \\__',
  '  /_________________\\',
  ...CHEST_BODY,
] as const

/** A plain sword coming up out of the chest, in the three stages of its rise. */
export const CHEST_SWORD_RISING = [
  [
    '      \\    /\\   /',
    '   .   \\   ||  /   .',
    '       ____||___',
    '    __/    ||   \\__',
    '  /_________________\\',
    ...CHEST_BODY,
  ],
  [
    '           /\\',
    '      \\    ||   /',
    '   .   \\   ||  /   .',
    '       ____||___',
    '    __/  __||__ \\__',
    '  /_________________\\',
    ...CHEST_BODY,
  ],
  [
    '           /\\',
    '           ||',
    '           ||',
    '      \\    ||   /',
    '   .   \\ __||__/   .',
    '       ____||___',
    '    __/    ()   \\__',
    '  /_________________\\',
    ...CHEST_BODY,
  ],
] as const

/** A small train of no particular make, for `sl`. */
export const TRAIN_DRAWING = [
  '     ( )  ( )',
  '      _____   ____________',
  '   __|     |_|            |',
  '  |__  []  __  []  []  [] |',
  '  |__|_____|_|____________|',
  '    (O)   (O)  (O)    (O)',
] as const
