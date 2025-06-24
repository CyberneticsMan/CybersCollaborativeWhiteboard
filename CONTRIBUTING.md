# Contributing to Collaborative Whiteboard

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Code Style

### Python Code
- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Keep functions small and focused (max 20-30 lines)
- Use type hints where appropriate

### JavaScript Code
- Use ES6+ features
- Follow consistent naming conventions (camelCase)
- Add comments for complex logic
- Keep functions pure when possible
- Use meaningful class and method names

### HTML/CSS
- Use semantic HTML5 elements
- Follow BEM methodology for CSS classes
- Ensure responsive design
- Maintain accessibility standards

## Commit Messages

Write clear, concise commit messages:
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Bug Reports

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We love feature requests! Please provide:

- A clear and detailed explanation of the feature
- Why this feature would be useful
- How it should work
- Examples of how it would be used

## Development Setup

1. Fork and clone the repository
2. Create a virtual environment: `python -m venv .venv`
3. Activate it: `source .venv/bin/activate` (or `.venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Start the development server: `python main.py`

## Testing

Currently, we're looking for contributors to help set up a comprehensive testing framework. Areas that need testing:

- Socket.IO event handling
- Drawing functionality
- Room management
- User interactions
- Cross-browser compatibility

## Priority Areas for Contribution

1. **Testing Framework**: Set up unit and integration tests
2. **Mobile Optimization**: Improve touch interactions
3. **Performance**: Optimize drawing performance for large canvases
4. **Accessibility**: Add keyboard navigation and screen reader support
5. **Features**: Implement shape tools, text tool, layers
6. **Documentation**: Add more examples and tutorials

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with the "question" label if you have any questions about contributing!

---

Thank you for your interest in making this project better! 🎨