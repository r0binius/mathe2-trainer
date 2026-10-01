//! Reading the shortcuts in an app's menus, through the Accessibility API.

use crate::error::AppError;
use crate::platform::macos::accessibility::{Element, Value};
use crate::platform::macos::menu_keys::{KeyEquivalent, keys_of};
use crate::platform::{MenuGroup, MenuShortcut};

/// How long to wait for each answer of the app, in seconds. A hung app fails the lookup after
/// this, rather than leaving the popover waiting.
const TIMEOUT: f32 = 1.0;

/// How deep submenus are read. Menus are rarely nested more than twice; the limit only guards
/// against an app whose menus never end.
const MAX_DEPTH: usize = 4;

const MENU_BAR: &str = "AXMenuBar";
const CHILDREN: &str = "AXChildren";
const TITLE: &str = "AXTitle";

/// What's read of each menu item, in one message: its title, its key equivalent and its submenu.
const ITEM: [&str; 5] = [
    TITLE,
    "AXMenuItemCmdChar",
    "AXMenuItemCmdGlyph",
    "AXMenuItemCmdModifiers",
    CHILDREN,
];

/// The shortcuts in the menus of the app running as `process`, by top-level menu, in menu bar
/// order. The Apple menu is left out: its shortcuts belong to the system.
///
/// # Errors
///
/// Returns a lookup error if the app has no menu bar or doesn't answer in time.
pub fn read_menus(process: i32) -> Result<Vec<MenuGroup>, AppError> {
    let app = Element::application(process, TIMEOUT)?;
    let Value::Element(menu_bar) = value(&app, MENU_BAR)? else {
        return Err(AppError::lookup("the app has no menu bar"));
    };

    let groups = elements(&menu_bar, CHILDREN)?
        .iter()
        // The Apple menu always comes first.
        .skip(1)
        .map(group_of)
        .collect::<Result<Vec<_>, _>>()?;

    Ok(groups
        .into_iter()
        .filter(|group| !group.shortcuts.is_empty())
        .collect())
}

/// The shortcuts of a top-level menu, under its title.
fn group_of(menu_bar_item: &Element) -> Result<MenuGroup, AppError> {
    let [title, menus] = values(menu_bar_item, [TITLE, CHILDREN])?;

    Ok(MenuGroup {
        title: text(title).unwrap_or_default(),
        shortcuts: shortcuts_in_all(menus, 0)?,
    })
}

/// The shortcuts in the `menus` an item opens (one, if any), `depth` submenus deep.
fn shortcuts_in_all(menus: Value, depth: usize) -> Result<Vec<MenuShortcut>, AppError> {
    let Value::Elements(menus) = menus else {
        return Ok(Vec::new());
    };
    if depth > MAX_DEPTH {
        return Ok(Vec::new());
    }

    let items = menus
        .iter()
        .map(|menu| elements(menu, CHILDREN))
        .collect::<Result<Vec<_>, _>>()?;
    let shortcuts = items
        .iter()
        .flatten()
        .map(|item| shortcuts_of(item, depth))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(shortcuts.into_iter().flatten().collect())
}

/// The item's own shortcut, if it has one, followed by those in its submenu.
fn shortcuts_of(item: &Element, depth: usize) -> Result<Vec<MenuShortcut>, AppError> {
    let [title, character, glyph, modifiers, submenu] = values(item, ITEM)?;
    let character = text(character);
    let keys = keys_of(KeyEquivalent {
        character: character.as_deref(),
        glyph: number(&glyph),
        modifiers: number(&modifiers).unwrap_or_default(),
    });
    let own = text(title)
        .filter(|title| !title.is_empty())
        .zip(keys)
        .map(|(title, keys)| MenuShortcut { title, keys });

    let nested = shortcuts_in_all(submenu, depth.saturating_add(1))?;
    Ok(own.into_iter().chain(nested).collect())
}

fn value(element: &Element, attribute: &str) -> Result<Value, AppError> {
    let [value] = values(element, [attribute])?;
    Ok(value)
}

fn elements(element: &Element, attribute: &str) -> Result<Vec<Element>, AppError> {
    match value(element, attribute)? {
        Value::Elements(elements) => Ok(elements),
        _ => Ok(Vec::new()),
    }
}

/// The values of `N` attributes, as an array to destructure.
fn values<const N: usize>(
    element: &Element,
    attributes: [&str; N],
) -> Result<[Value; N], AppError> {
    element
        .values(&attributes)?
        .try_into()
        .map_err(|_| AppError::lookup("the app answered with another number of values"))
}

fn text(value: Value) -> Option<String> {
    match value {
        Value::Text(text) => Some(text),
        _ => None,
    }
}

fn number(value: &Value) -> Option<i64> {
    match *value {
        Value::Number(number) => Some(number),
        _ => None,
    }
}
