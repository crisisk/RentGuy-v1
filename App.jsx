import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { CheckCircle, Music, Users, Calendar, CreditCard, Settings, ArrowRight, ArrowLeft } from 'lucide-react'
import mrDjLogo from './assets/mr_dj_logo.png'
import './App.css'

const ONBOARDING_STEPS = [
  { id: 1, title: 'Bedrijf & Doelen', icon: Settings },
  { id: 2, title: 'Rollen & Toegang', icon: Users },
  { id: 3, title: 'Inventaris & Pakketten', icon: Music },
  { id: 4, title: 'Prijzen & Planning', icon: CreditCard },
  { id: 5, title: 'Kalender & Crew', icon: Calendar },
  { id: 6, title: 'Finalisatie', icon: CheckCircle }
]

function App() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Bedrijf & Doelen
    companyName: 'Mr. DJ',
    services: 'Drive-in shows (bruiloften, zakelijke evenementen, verjaardagen) + AV-verhuur',
    goals: ['', '', ''],
    kpis: '',
    seasonalPeaks: true,
    projectsPerYear: 100,
    
    // Step 2: Rollen & Toegang
    roles: ['Beheerder', 'Finance', 'Planner', 'Magazijn', 'Crew (via e-mail)', 'Alleen-lezen'],
    twoFactorAuth: true,
    crewInviteOnly: true,
    
    // Step 3: Inventaris & Pakketten
    materialTypes: 'Pakketten (licht, geluid, kabels, meubels)',
    usePackages: true,
    trackSerialNumbers: false,
    trackMaintenance: false,
    lowStockAlerts: true,
    alertEmail: 'info@mr-dj.nl',
    
    // Step 4: Prijzen & Planning
    pricingModel: 'per-dag',
    tieredDiscount: true,
    discountStructure: 'dag 1=1, elke dag daarna 0.5',
    vatRates: ['21%', '9%'],
    
    // Step 5: Kalender & Crew
    calendarView: 'week',
    allowDragDrop: true,
    doubleBookingWarning: true,
    crewCommunication: 'E-mail agenda-uitnodiging, evt. WhatsApp',
    
    // Step 6: Finalisatie
    successCriteria: 'Binnen 5 minuten project/crew boeken; PDF\'s in huisstijl werken; factuur & betaalflow getest; kalender ICS werkt',
    goLiveDate: 'ASAP'
  })

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = (currentStep / ONBOARDING_STEPS.length) * 100

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Officiële bedrijfsnaam</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectsPerYear">Projecten per jaar</Label>
                <Input
                  id="projectsPerYear"
                  type="number"
                  value={formData.projectsPerYear}
                  onChange={(e) => updateFormData('projectsPerYear', parseInt(e.target.value))}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="services">Welke diensten bied je aan?</Label>
              <Textarea
                id="services"
                value={formData.services}
                onChange={(e) => updateFormData('services', e.target.value)}
                className="border-purple-200 focus:border-purple-500"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>3 belangrijkste doelen voor de komende 6-12 maanden</Label>
              {formData.goals.map((goal, index) => (
                <Input
                  key={index}
                  placeholder={`Doel ${index + 1}`}
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...formData.goals]
                    newGoals[index] = e.target.value
                    updateFormData('goals', newGoals)
                  }}
                  className="border-purple-200 focus:border-purple-500"
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="seasonalPeaks"
                checked={formData.seasonalPeaks}
                onCheckedChange={(checked) => updateFormData('seasonalPeaks', checked)}
              />
              <Label htmlFor="seasonalPeaks">Seizoenspieken (mei-juni, juli/aug, september)</Label>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Gewenste rollen in het systeem</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.roles.map((role, index) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 p-2">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="twoFactorAuth"
                  checked={formData.twoFactorAuth}
                  onCheckedChange={(checked) => updateFormData('twoFactorAuth', checked)}
                />
                <Label htmlFor="twoFactorAuth">2-staps-verificatie verplichten (Microsoft Authenticator)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="crewInviteOnly"
                  checked={formData.crewInviteOnly}
                  onCheckedChange={(checked) => updateFormData('crewInviteOnly', checked)}
                />
                <Label htmlFor="crewInviteOnly">Crewleden alleen via uitnodiging</Label>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="materialTypes">Soorten materialen</Label>
              <Textarea
                id="materialTypes"
                value={formData.materialTypes}
                onChange={(e) => updateFormData('materialTypes', e.target.value)}
                className="border-purple-200 focus:border-purple-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="usePackages"
                    checked={formData.usePackages}
                    onCheckedChange={(checked) => updateFormData('usePackages', checked)}
                  />
                  <Label htmlFor="usePackages">Samengestelde sets gebruiken</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackSerialNumbers"
                    checked={formData.trackSerialNumbers}
                    onCheckedChange={(checked) => updateFormData('trackSerialNumbers', checked)}
                  />
                  <Label htmlFor="trackSerialNumbers">Serienummers bijhouden</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trackMaintenance"
                    checked={formData.trackMaintenance}
                    onCheckedChange={(checked) => updateFormData('trackMaintenance', checked)}
                  />
                  <Label htmlFor="trackMaintenance">Onderhoud/keuringsdata bijhouden</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowStockAlerts"
                    checked={formData.lowStockAlerts}
                    onCheckedChange={(checked) => updateFormData('lowStockAlerts', checked)}
                  />
                  <Label htmlFor="lowStockAlerts">Meldingen bij lage voorraad</Label>
                </div>

                {formData.lowStockAlerts && (
                  <div className="space-y-2">
                    <Label htmlFor="alertEmail">E-mailadres voor meldingen</Label>
                    <Input
                      id="alertEmail"
                      type="email"
                      value={formData.alertEmail}
                      onChange={(e) => updateFormData('alertEmail', e.target.value)}
                      className="border-purple-200 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pricingModel">Prijsmodel</Label>
                <Select value={formData.pricingModel} onValueChange={(value) => updateFormData('pricingModel', value)}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per-dag">Per dag</SelectItem>
                    <SelectItem value="per-uur">Per uur</SelectItem>
                    <SelectItem value="per-project">Per project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountStructure">Staffelkorting structuur</Label>
                <Input
                  id="discountStructure"
                  value={formData.discountStructure}
                  onChange={(e) => updateFormData('discountStructure', e.target.value)}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>BTW-tarieven</Label>
              <div className="flex gap-3">
                {formData.vatRates.map((rate, index) => (
                  <Badge key={index} variant="outline" className="border-purple-300 text-purple-700">
                    {rate}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="tieredDiscount"
                checked={formData.tieredDiscount}
                onCheckedChange={(checked) => updateFormData('tieredDiscount', checked)}
              />
              <Label htmlFor="tieredDiscount">Staffelkorting gebruiken</Label>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="calendarView">Kalenderweergave</Label>
                <Select value={formData.calendarView} onValueChange={(value) => updateFormData('calendarView', value)}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week (toggle dag/maand)</SelectItem>
                    <SelectItem value="month">Maand</SelectItem>
                    <SelectItem value="day">Dag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowDragDrop"
                    checked={formData.allowDragDrop}
                    onCheckedChange={(checked) => updateFormData('allowDragDrop', checked)}
                  />
                  <Label htmlFor="allowDragDrop">Projecten kunnen verslepen</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doubleBookingWarning"
                    checked={formData.doubleBookingWarning}
                    onCheckedChange={(checked) => updateFormData('doubleBookingWarning', checked)}
                  />
                  <Label htmlFor="doubleBookingWarning">Waarschuwing bij dubbele boeking</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crewCommunication">Crew communicatie methode</Label>
              <Textarea
                id="crewCommunication"
                value={formData.crewCommunication}
                onChange={(e) => updateFormData('crewCommunication', e.target.value)}
                className="border-purple-200 focus:border-purple-500"
                rows={3}
              />
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold text-purple-800">Onboarding Voltooid!</h3>
              <p className="text-gray-600">Je Mr. DJ RentGuy configuratie is klaar voor implementatie.</p>
            </div>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Succescriteria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{formData.successCriteria}</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Volgende Stappen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Configuratie opgeslagen in RentGuy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Mr. DJ huisstijl geïmplementeerd</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Testomgeving beschikbaar op sevena.rentguy.nl</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Productieomgeving klaar op rentguy.mrdj.nl</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={mrDjLogo} alt="Mr. DJ Logo" className="w-12 h-12 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold text-white">Mr. DJ</h1>
                <p className="text-purple-200 text-sm">RentGuy Onboarding Portal</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Stap {currentStep} van {ONBOARDING_STEPS.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white font-medium">Voortgang</span>
            <span className="text-purple-200">{Math.round(progress)}% voltooid</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {ONBOARDING_STEPS.map((step) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-purple-800'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <Card className="max-w-4xl mx-auto border-purple-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">
              {ONBOARDING_STEPS[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription className="text-purple-100">
              {currentStep === 1 && "Laten we beginnen met de basisinformatie over je bedrijf"}
              {currentStep === 2 && "Configureer gebruikersrollen en toegangsbeheer"}
              {currentStep === 3 && "Stel je inventaris en pakketten in"}
              {currentStep === 4 && "Definieer je prijsmodel en planning"}
              {currentStep === 5 && "Configureer kalender en crew management"}
              {currentStep === 6 && "Je configuratie is voltooid!"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center p-6 bg-gray-50 rounded-b-lg">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vorige
            </Button>

            {currentStep < ONBOARDING_STEPS.length ? (
              <Button
                onClick={nextStep}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Volgende
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                onClick={() => alert('Configuratie opgeslagen! RentGuy wordt nu ingericht voor Mr. DJ.')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Configuratie Opslaan
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default App
