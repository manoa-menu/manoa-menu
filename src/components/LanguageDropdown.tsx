import React from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

const LanguageDropdown = () => {
  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Japanese', code: 'jp' },
    { name: 'Korean', code: 'kr' },
    { name: 'Spanish', code: 'es' },
  ];

  return (
    <DropdownButton id="dropdown-basic-button" title="Dropdown button">
      {languages.map((language) => (
        <Dropdown.Item key={language.code} href={`/${language.code}`}>
          {language.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export default LanguageDropdown;
