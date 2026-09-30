//! Prints the keyboard layout in use as fixture JSON, like `src/domain/keyboard/*.fixture.json`.
//!
//! `cargo run --example dump_keymap` translates keys for the connected keyboard, and
//! `cargo run --example dump_keymap -- --ansi` as on an ANSI keyboard, for the US fixture on an
//! ISO Mac. Select the layout in the menu bar first; its ID is printed to stderr.

#![expect(
    clippy::print_stdout,
    clippy::print_stderr,
    reason = "the fixture is the output, and the layout ID a note beside it"
)]

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let ansi = std::env::args().any(|argument| argument == "--ansi");

    let (id, keymap) = mouseless::dump_keymap(ansi)?;

    eprintln!("{id}");
    println!("{keymap}");

    Ok(())
}
