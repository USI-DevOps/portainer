package migrator

import (
	"github.com/portainer/portainer/api"
)

func (m *Migrator) updateSettingsToDB24() error {
	legacySettings, err := m.settingsService.Settings()
	if err != nil {
		return err
	}

	if legacySettings.TemplatesURL == "" {
		legacySettings.TemplatesURL = portainer.DefaultTemplatesURL
	}

	legacySettings.UserSessionTimeout = portainer.DefaultUserSessionTimeout

	return m.settingsService.UpdateSettings(legacySettings)
}

func (m *Migrator) updateStacksToDB24() error {
	stacks, err := m.stackService.Stacks()
	if err != nil {
		return err
	}

	for idx := range stacks {
		stack := &stacks[idx]
		stack.Status = portainer.StackStatusActive
		err := m.stackService.UpdateStack(stack.ID, stack)
		if err != nil {
			return err
		}
	}

	return nil
}
