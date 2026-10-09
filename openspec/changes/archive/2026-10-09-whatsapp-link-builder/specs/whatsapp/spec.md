# Spec: whatsapp-link-builder

## ADDED Requirements

### Requirement: Build validated WhatsApp deep link

The system SHALL provide a pure function `buildWhatsAppLink(phone, message?)` that returns a
`https://wa.me/<digits>[?text=<encoded>]` URL.

#### Scenario: Valid phone without message

- **GIVEN** a phone string containing 8–15 digits (separators allowed)
- **WHEN** `buildWhatsAppLink` is called without a message
- **THEN** it returns `https://wa.me/<digits-only>`

#### Scenario: Valid phone with message

- **GIVEN** a valid phone and a non-empty message
- **WHEN** `buildWhatsAppLink` is called with both
- **THEN** it returns `https://wa.me/<digits>?text=<encodeURIComponent(message)>`

#### Scenario: Separators are stripped

- **GIVEN** input like `+54 9 11 1234-5678`
- **WHEN** `buildWhatsAppLink` is called
- **THEN** all non-digit characters are removed before validation and URL building

#### Scenario: Invalid phone is rejected

- **GIVEN** a phone with fewer than 8 or more than 15 digits, or with no digits at all
- **WHEN** `buildWhatsAppLink` is called
- **THEN** it throws `Error('Invalid WhatsApp phone number')`

#### Scenario: Empty message behaves as absent

- **GIVEN** a valid phone and an empty/whitespace-only message
- **WHEN** `buildWhatsAppLink` is called
- **THEN** it returns the bare `https://wa.me/<digits>` URL with no `?text=` param
