# TicketScout - AI-Powered Deal Finder

TicketScout is a modern web application that helps users find the best deals on high-demand items like concert tickets, sneakers, and sports events. The application features a beautiful celestial-themed interface and integrates with voice recognition for hands-free searching.

## Features

- 🌟 Celestial-themed modern UI
- 🎤 Voice search capability
- 🔍 Advanced filtering and sorting options
- 📱 Responsive design for all devices
- 🔔 Real-time notifications
- 💬 Integration with OmniDimension voice agent

## Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- JavaScript (ES6+)
- Web Speech API for voice recognition
- Font Awesome for icons
- Google Fonts (Space Grotesk)

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ticketscout.git
cd ticketscout
```

2. Open `index.html` in your web browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

3. Visit `http://localhost:8000` in your browser

## Voice Search Integration

The application uses the Web Speech API for voice recognition. To use voice search:

1. Click the "Start Voice Search" button
2. Allow microphone access when prompted
3. Speak your search query
4. The application will automatically search for matching deals

## OmniDimension Integration

To integrate with OmniDimension:

1. Sign up for an OmniDimension account
2. Get your API credentials
3. Update the `script.js` file with your API key
4. Uncomment and configure the OmniDimension API calls in the `selectDeal` function

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Background animations inspired by [Stars and Twinkling](https://codepen.io/saransh/pen/BKJun)
- Icons provided by [Font Awesome](https://fontawesome.com/)
- Fonts from [Google Fonts](https://fonts.google.com/) 