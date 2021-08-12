export const signinUser = {
  username: 'admin',
  password: 'testtest2',
};

export const signupUser = {
  username: 'testuser',
  name: 'Test',
  surname: 'Testowy',
  password: 'testowehaslo',
  retype: 'testowehaslo',
  email: 'test@email.com',
  about: 'Dis is a short test. So lets check if it works!',
  imagepath: 'cheems_user2021-08-11T14:04:50.726Z.jpg',
};

export const updateUser = {
  name: 'Changed name',
  surname: 'Changed surname',
  newPassword: 'testowehaslo',
  retypeNewPassword: 'testowehaslo',
  password: 'testtest2',
  email: 'wolny@email.com',
  about: 'Dis is a short test. So lets check if it works!',
};

export const signupUserInvalid = {
  username: 'te',
  name: 'Te',
  surname: 'Te',
  password: 'te',
  retype: 'te',
  email: 'test',
  about: 'Dis is a short test. So lets check if it works!'.repeat(50),
};
