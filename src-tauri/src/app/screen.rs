//! Where things are on the user's screens, for placing the popover and the banner.

use tauri::{Monitor, PhysicalPosition, PhysicalRect};

/// Whether `point` lies on the monitor's screen, menu bar included.
pub fn shows(monitor: &Monitor, point: PhysicalPosition<i32>) -> bool {
    let screen = PhysicalRect {
        position: *monitor.position(),
        size: *monitor.size(),
    };

    contains(screen, point)
}

fn contains(area: PhysicalRect<i32, u32>, point: PhysicalPosition<i32>) -> bool {
    let right = area.position.x.saturating_add(signed(area.size.width));
    let bottom = area.position.y.saturating_add(signed(area.size.height));

    (area.position.x..right).contains(&point.x) && (area.position.y..bottom).contains(&point.y)
}

/// A size as a coordinate. No screen is 2³¹ pixels wide, so the saturation never happens.
pub fn signed(length: u32) -> i32 {
    i32::try_from(length).unwrap_or(i32::MAX)
}

#[cfg(test)]
mod tests {
    use tauri::PhysicalSize;

    use super::*;

    const fn rect(x: i32, y: i32, width: u32, height: u32) -> PhysicalRect<i32, u32> {
        PhysicalRect {
            position: PhysicalPosition { x, y },
            size: PhysicalSize { width, height },
        }
    }

    #[test]
    fn finds_the_screen_a_point_is_on() {
        let left = rect(-1920, 0, 1920, 1080);

        assert!(contains(left, PhysicalPosition { x: -1, y: 0 }));
        assert!(!contains(left, PhysicalPosition { x: 0, y: 0 }));
    }
}
