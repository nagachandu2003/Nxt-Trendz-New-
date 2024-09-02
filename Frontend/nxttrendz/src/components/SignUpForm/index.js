import {Component} from 'react'
import Cookies from 'js-cookie'
import {Redirect} from 'react-router-dom'
import { Link } from 'react-router-dom'
import './index.css'

class SignUpForm extends Component {
  state = {
    username:'',
    name:'',
    password:'',
    gender:'',
    location:'',
    showSubmitError: false,
    errorMsg: '',
  }

  onChangeUsername = event => {
    this.setState({username: event.target.value})
  }
  onChangeName = event => {
    this.setState({name: event.target.value})
  }
  onChangeGender = event => {
    this.setState({gender: event.target.value})
  }
  onChangeLocation = event => {
    this.setState({location:event.target.value})
  }

  onChangePassword = event => {
    this.setState({password: event.target.value})
  }

  onSubmitSuccess = jwtToken => {
    const {history} = this.props

    Cookies.set('jwt_token', jwtToken, {
      expires: 30,
    })
    history.replace('/')
  }

  onSubmitFailure = errorMsg => {
    this.setState({showSubmitError: true, errorMsg})
  }

  postData = async (obj) => {
    try{
        const options = {
            method : "POST",
            headers : {
                "Content-Type" : "application/json"
            },
            body : JSON.stringify(obj)
        }
        const response = await fetch('https://nxt-trendz-new.vercel.app/register',options);
        const data = await response.json();
        if(data.message==="User Already Exists")
            this.onSubmitFailure(data.message);
        else if(data.message==="Password is too short")
            this.onSubmitFailure(data.message);
        else{
        alert("User Inserted Successfully");
        this.setState({username:'',name:'',password:'',gender:'',showSubmitError:false,location:''})
        }
    }
    catch(Err) {
        console.log(`Error Occurred : ${Err}`);
    }
  }

  submitForm = event => {
    event.preventDefault()
    const {username,
        name,
        password,
        gender,
        location} = this.state
    const userDetails = {username,
        name,
        password,
        gender,
        location};
    console.log(userDetails);
    this.postData(userDetails);
  }

  renderNameField = () => {
    const {name} = this.state

    return (
      <>
        <label className="input-label" htmlFor="name">
          NAME
        </label>
        <input
          type="text"
          id="name"
          className="password-input-field"
          value={name}
          onChange={this.onChangeName}
          placeholder="Name"
          required
        />
      </>
    )
  }
  
  renderGenderField = () => {
    // const {gender} = this.state

    return (
      <>
      <p className="input-label">GENDER</p>
      <div style={{display:'flex',alignItems:'center'}}>
      <div>
      <input
          type="radio"
          id="male"
          value = "Male"
          name="gender"
          onChange={this.onChangeGender}
        />
        <label className="input-label" htmlFor="male">
          Male
        </label>
        </div>
        <div>
        <input
          type="radio"
          id="female"
          value = "Female"
          name="gender"
          onChange={this.onChangeGender}
        />
        <label className="input-label" htmlFor="female">
          Female
        </label>
        </div>
        </div>
      </>
    )
  }

  renderLocationField = () => {
    const {location} = this.state

    return (
      <>
        <label className="input-label" htmlFor="location">
          LOCATION
        </label>
        <input
          type="text"
          id="location"
          className="password-input-field"
          value={location}
          onChange={this.onChangeLocation}
          placeholder="Location"
          required
        />
      </>
    )
  }



  renderPasswordField = () => {
    const {password} = this.state

    return (
      <>
        <label className="input-label" htmlFor="password">
          PASSWORD
        </label>
        <input
          type="password"
          id="password"
          className="password-input-field"
          value={password}
          onChange={this.onChangePassword}
          placeholder="Password"
          required
        />
      </>
    )
  }

  renderUsernameField = () => {
    const {username} = this.state

    return (
      <>
        <label className="input-label" htmlFor="username">
          USERNAME
        </label>
        <input
          type="text"
          id="username"
          className="username-input-field"
          value={username}
          onChange={this.onChangeUsername}
          placeholder="Username"
          required
        />
      </>
    )
  }

  render() {
    const {showSubmitError, errorMsg} = this.state
    const jwtToken = Cookies.get('jwt_token')

    if (jwtToken !== undefined) {
      return <Redirect to="/" />
    }

    return (
      <div className="login-form-main-container">
        <div className="login-form-container">
          <img
            src="https://assets.ccbp.in/frontend/react-js/nxt-trendz-logo-img.png"
            className="login-website-logo-mobile-img"
            alt="website logo"
          />
          <img
            src="https://assets.ccbp.in/frontend/react-js/nxt-trendz-login-img.png"
            className="login-img"
            alt="website login"
          />
          <form className="form-container" onSubmit={this.submitForm}>
            <img
              src="https://assets.ccbp.in/frontend/react-js/nxt-trendz-logo-img.png"
              className="login-website-logo-desktop-img"
              alt="website logo"
            />
            <div className="input-container">{this.renderNameField()}</div>
            <div className="input-container">{this.renderUsernameField()}</div>
            <div className="input-container">{this.renderPasswordField()}</div>
            <div className="input-container">{this.renderGenderField()}</div>
            <div className="input-container">{this.renderLocationField()}</div>
            <button type="submit" className="login-button">
              Sign Up
            </button>
            <div style={{display:'flex'}}>
            <p>Already Have an account?</p>
            <Link to="/login">
            <p className='login-link'>Login</p>
            </Link>
            </div>
            {showSubmitError && <p className="new-err-msg error-message">*{errorMsg}</p>}
          </form>
        </div>
      </div>
    )
  }
}

export default SignUpForm