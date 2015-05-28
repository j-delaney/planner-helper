# Change Log

## Unreleased
### Fixed
- Teachers with different names on RMP than the course listing will now properly fetch data.
- Entire extension breaking since Chrome is no longer giving XHTTP status codes.

## 1.0.1 (2015-05-01)
### Added
- Basic non-persistent caching (so it doesn't keep regrabbing the same data).

### Fixed
- URLs for the different sections are now correct.
- Bug where the wrong data would display if the user clicks on a new class while the old one is still loading.
- Attempting to load CAPE and Grade Distribution for discussion sections.
- Unnecessary reloading when clicking a different lecture time for the same teacher/course. 

## 1.0.0 (2015-04-08)
### Changed
- Refactor of all the code
